// AI suggestion engine.
//
// Phase 1 (always active): hero tier, lane flexibility (bans), your team's
// empty-lane gaps (picks), and your Comfort/Super Comfort profile (picks,
// only when Algorithm mode = "comfort").
//
// Phase 2 (active once data/hero-stats.json is populated — currently `{}`,
// so every bonus below silently evaluates to 0 and behavior is identical
// to Phase 1): counters, ally synergy, and real win/pick/ban rate.
// See data/hero-stats.json for the expected shape per hero:
//   {
//     "<slug>": {
//       "winRate": 0.512,            // 0–1, this hero's overall win rate
//       "pickRate": 0.083,           // 0–1
//       "banRate": 0.041,            // 0–1
//       "counters": ["slug", ...],    // heroes THIS hero performs well against
//       "counteredBy": ["slug", ...], // heroes that perform well against THIS hero
//       "synergizesWith": ["slug", ...] // heroes this one has a strong lane/combo with
//     }
//   }
// A hero missing from the file, or missing individual fields, just
// contributes 0 for those terms — nothing breaks with partial data.

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
const WIN_RATE_WEIGHT = 120; // (winRate - 0.5) * WIN_RATE_WEIGHT -> ~±12 for a 55%/45% hero
const BAN_RATE_WEIGHT = 60; // ban phase: high real ban rate = other players think it's worth banning
const COUNTER_BONUS_PER_HERO = 25; // per enemy pick this hero counters
const COUNTER_PENALTY_PER_HERO = 25; // per enemy pick that counters this hero
const SYNERGY_BONUS_PER_HERO = 15; // per ally pick this hero synergizes with

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
  if (flexBonus > 0) reasons.push(`flexible · ${hero.roles.length} lanes`);
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
  const winRateBonus = stats?.winRate != null ? (stats.winRate - 0.5) * WIN_RATE_WEIGHT : 0;

  const counteredOpponents = opponentPicks.filter((slug) => heroCounters(hero, slug));
  const counterBonus = counteredOpponents.length * COUNTER_BONUS_PER_HERO;

  const countersAgainstUs = opponentPicks.filter((slug) => heroIsCounteredBy(hero, slug));
  const counterPenalty = countersAgainstUs.length * COUNTER_PENALTY_PER_HERO;

  const synergyAllies = teamPicks.filter((slug) => stats?.synergizesWith?.includes(slug));
  const synergyBonus = synergyAllies.length * SYNERGY_BONUS_PER_HERO;

  const reasons = [`${hero.tier}-tier`];
  if (gapBonus > 0) reasons.push(`fills ${missingCovered.join("/")}`);
  if (comfortBonus > 0) reasons.push(comfortLevel === "super" ? "Super Comfort" : "Comfort pick");
  if (winRateBonus !== 0) reasons.push(`${Math.round(stats.winRate * 100)}% win rate`);
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