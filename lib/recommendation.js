// AI suggestion engine.
//
// Phase 1 (always active): hero tier, lane flexibility (bans), your team's
// empty-lane gaps (picks), and your Comfort/Super Comfort profile (picks,
// only when Algorithm mode = "comfort").
//
// Phase 2 (active now that data/hero-stats.json is populated): counters,
// ally synergy, and real win/pick/ban rate, sourced from Liquipedia's
// Honor of Kings World Cup 2026 Statistics page (pro tournament data,
// not solo-queue ladder — see note below). A hero missing from the file,
// or missing individual fields, just contributes 0 for those terms —
// nothing breaks with partial data. Shape per hero:
//   {
//     "<slug>": {
//       "winRate": 0.512,             // 0–1, this hero's win rate at the tournament
//       "gamesPlayed": 53,             // sample size — used to damp winRate confidence
//       "pickRate": 0.083,             // 0–1, % of games this hero was picked in
//       "banRate": 0.041,              // 0–1, % of games this hero was banned in
//       "counters": ["slug", ...],     // heroes THIS hero has a strong (>=55% WR, >=3 games) record against
//       "counteredBy": ["slug", ...],  // heroes with a strong record against THIS hero
//       "synergizesWith": ["slug", ...] // ally heroes with a strong (>=55% WR, >=3 games) record alongside this one
//     }
//   }
//
// Source caveat: this is pro tournament data (deliberate, scouted picks —
// not accidental), used for both Rank Draft and Tournament Draft per the
// team's decision, but it's still a single event's sample. That's why
// winRate is confidence-scaled by gamesPlayed below, while counters/synergy
// (structural kit relationships, not just a stat) aren't damped the same
// way — the >=3-game floor applied when the file was built already screens
// out 1-game flukes there.

import { heroBySlug } from "./heroes";
import heroStatsData from "@/data/hero-stats.json";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
const GAP_BONUS_PER_LANE = 35; // pick phase: rewards filling a lane your team has none of yet

const COMFORT_BONUS = {
  standard: { super: 0, comfort: 0 },
  comfort: { super: 90, comfort: 45 },
};

// Phase 2 weights — tuned conservatively so real stats nudge the score
// rather than overwhelm tier/gap/comfort once they're in place.
const WIN_RATE_WEIGHT = 120; // (winRate - 0.5) * WIN_RATE_WEIGHT -> ~±12 for a 55%/45% hero, at full confidence
const BAN_RATE_WEIGHT = 60; // ban phase: high real ban rate = other players think it's worth banning
const COUNTER_BONUS_PER_HERO = 25; // per enemy pick this hero counters
const COUNTER_PENALTY_PER_HERO = 25; // per enemy pick that counters this hero
const SYNERGY_BONUS_PER_HERO = 15; // per ally pick this hero synergizes with

// Small-sample damping for winRate specifically. A hero picked in 2 tournament
// games isn't proven at 100%/0% the way one picked in 50 games is — this
// scales the win-rate bonus toward 0 as gamesPlayed drops below the
// confidence threshold, so single-tournament data doesn't overreact to noise.
// Counters/synergy are structural (a kit either beats another kit or it
// doesn't) so they aren't damped the same way, but the >=3 game floor
// applied when hero-stats.json was built already filters out 1-game flukes.
const WIN_RATE_CONFIDENCE_GAMES = 15; // games needed for full win-rate weight
function confidenceScale(gamesPlayed) {
  if (!gamesPlayed) return 0;
  return Math.min(1, gamesPlayed / WIN_RATE_CONFIDENCE_GAMES);
}

function getHeroStats(slug) {
  return heroStatsData[slug] || null;
}

// True if `hero` counters `opponentSlug`, checking both this hero's
// `counters` list and the opponent's `counteredBy` list (a scrape may only
// populate one side per hero page).
function heroCounters(hero, opponentSlug) {
  const stats = getHeroStats(hero.slug);
  if (stats?.counters?.includes(opponentSlug)) return true;
  const oppStats = getHeroStats(opponentSlug);
  if (oppStats?.counteredBy?.includes(hero.slug)) return true;
  return false;
}

function heroIsCounteredBy(hero, opponentSlug) {
  const stats = getHeroStats(hero.slug);
  if (stats?.counteredBy?.includes(opponentSlug)) return true;
  const oppStats = getHeroStats(opponentSlug);
  if (oppStats?.counters?.includes(hero.slug)) return true;
  return false;
}

export function scoreBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const flexBonus = (hero.roles.length - 1) * FLEX_BONUS_PER_EXTRA_LANE;

  const stats = getHeroStats(hero.slug);
  const banRateBonus = stats?.banRate ? stats.banRate * BAN_RATE_WEIGHT : 0;

  const reasons = [`${hero.tier}-tier`];
  if (flexBonus > 0) reasons.push(`flexible · ${hero.roles.join("/")}`);
  if (banRateBonus > 0) reasons.push(`${Math.round(stats.banRate * 100)}% ban rate`);

  return { hero, score: tierScore + flexBonus + banRateBonus, reasons };
}

// teamPicks: your own team's picked slugs so far (for synergy + lane gaps)
// opponentPicks: the enemy team's picked slugs so far (for counters)
export function scorePickCandidate(
  hero,
  { filledLanes, algorithmMode, comfortLevel, opponentPicks = [], teamPicks = [] }
) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;
  const comfortWeights = COMFORT_BONUS[algorithmMode] || COMFORT_BONUS.standard;
  const comfortBonus = comfortLevel ? comfortWeights[comfortLevel] || 0 : 0;

  const stats = getHeroStats(hero.slug);
  const winRateBonus =
    stats?.winRate != null
      ? (stats.winRate - 0.5) * WIN_RATE_WEIGHT * confidenceScale(stats.gamesPlayed)
      : 0;

  const counteredOpponents = opponentPicks.filter((slug) => heroCounters(hero, slug));
  const counterBonus = counteredOpponents.length * COUNTER_BONUS_PER_HERO;

  const countersAgainstUs = opponentPicks.filter((slug) => heroIsCounteredBy(hero, slug));
  const counterPenalty = countersAgainstUs.length * COUNTER_PENALTY_PER_HERO;

  const synergyAllies = teamPicks.filter((slug) => stats?.synergizesWith?.includes(slug));
  const synergyBonus = synergyAllies.length * SYNERGY_BONUS_PER_HERO;

  const reasons = [`${hero.tier}-tier`];
  if (gapBonus > 0) {
    reasons.push(`fills ${missingCovered.join("/")}`);
  } else if (hero.roles.length > 1) {
    // Not filling a gap, but still worth surfacing that this pick is flexible —
    // e.g. Kongming can go Mid or Jungle even when the team doesn't need either yet.
    reasons.push(`flex: ${hero.roles.join("/")}`);
  }
  if (comfortBonus > 0) reasons.push(comfortLevel === "super" ? "Super Comfort" : "Comfort pick");
  if (winRateBonus !== 0) {
    reasons.push(`${Math.round(stats.winRate * 100)}% WR (${stats.gamesPlayed}g, Worlds '26)`);
  }
  if (counterBonus > 0) {
    const names = counteredOpponents.map((s) => heroBySlug(s)?.name || s).join("/");
    reasons.push(`counters ${names}`);
  }
  if (counterPenalty > 0) {
    const names = countersAgainstUs.map((s) => heroBySlug(s)?.name || s).join("/");
    reasons.push(`countered by ${names}`);
  }
  if (synergyBonus > 0) {
    const names = synergyAllies.map((s) => heroBySlug(s)?.name || s).join("/");
    reasons.push(`synergy w/ ${names}`);
  }

  const score =
    tierScore + gapBonus + comfortBonus + winRateBonus + counterBonus - counterPenalty + synergyBonus;

  return { hero, score, reasons };
}

// Union of lanes already covered by a team's current picks.
export function getFilledLanes(pickedSlugs) {
  const set = new Set();
  pickedSlugs.forEach((slug) => {
    const hero = heroBySlug(slug);
    if (hero) hero.roles.forEach((r) => set.add(r));
  });
  return set;
}

// availableHeroes: heroes not yet banned/picked by anyone
// phase: "ban" | "pick"
// teamPicks: current team's picked slugs so far (used for "pick": lane gaps + synergy)
// opponentPicks: enemy team's picked slugs so far (used for "pick": counters)
// algorithmMode: "standard" | "comfort"
// getComfortLevel: (hero) => null | "comfort" | "super"
export function getSuggestions({
  availableHeroes,
  phase,
  teamPicks = [],
  opponentPicks = [],
  algorithmMode,
  getComfortLevel,
  topN = 3,
}) {
  if (phase === "ban") {
    return availableHeroes
      .map(scoreBanCandidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  if (phase === "pick") {
    const filledLanes = getFilledLanes(teamPicks);
    return availableHeroes
      .map((hero) =>
        scorePickCandidate(hero, {
          filledLanes,
          algorithmMode,
          comfortLevel: getComfortLevel ? getComfortLevel(hero) : null,
          opponentPicks,
          teamPicks,
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}