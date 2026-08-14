// Phase 1 + Phase 2 AI suggestion engine.
//
// Factors in: hero tier, lane flexibility (bans), your team's empty-lane
// gaps (picks - based on the ACTUAL role each pick was drafted for, not
// a flex hero's full role list), your Comfort/Super Comfort profile
// (picks, comfort mode only), real counter-pick data (picks - merged
// from HoKStats' Counters Explorer + a community-curated set with extra
// off-role matchups), team synergy (picks - community-curated combos of
// heroes that work well together), REAL tournament pick/ban/win-rate data
// (both phases - see data/tournament-stats.json), and Blue/Red side
// context (pick phase - see below).
//
// Hard rule: if every lane a hero can play is already filled on your
// team, that hero is dropped from suggestions entirely - not just
// deprioritized. A flex hero who can still fill an open lane stays
// suggestible.
//
// Blue Side (Team A, first pick) vs Red Side (Team B):
// Snake order (A,B,B,A,A,B,B,A,A,B) means only the very first pick of the
// whole draft is truly blind - every other pick already has at least one
// enemy hero revealed to react to. When a pick IS blind (no enemy picks
// yet, which given PICK_ORDER can only be Blue's opening pick), counter
// and synergy bonuses are naturally zero since there's nothing to read
// yet - so instead we lean harder on proven tournament strength (tier,
// presence, win rate) and penalize heroes with a lot of known hard
// counters, since revealing a heavily-counterable hero into the unknown
// is the riskiest possible pick. Every other pick already gets real
// counter/synergy signal from the picks on the board, so no extra
// weighting is needed there - Red's structural advantage (always reacts
// to something, gets the last pick of the draft) already falls out of
// that data naturally.
//
// Still NOT factored in: damage-type/CC balance. Counter/synergy/
// tournament-stat data all have real gaps (not every hero has evidence
// or games played) - heroes without it simply get zero bonus, never
// penalized or guessed at.

import { heroBySlug, counterDataFor, communityCounterNote, synergyPartnersFor, tournamentStatsFor } from "./heroes";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
const GAP_BONUS_PER_LANE = 35; // pick phase: rewards filling a lane your team has none of yet
const COUNTER_BONUS_PER_HIT = 30; // pick phase: candidate beats an already-picked enemy hero
const COUNTER_PENALTY_PER_HIT = 20; // pick phase: an already-picked enemy hero beats the candidate
const SYNERGY_BONUS_PER_HIT = 22; // pick phase: candidate pairs well with an already-picked teammate

// Real tournament data weighting. Ban phase leans on it harder than pick
// phase, because "what does the meta actually prioritize" is close to the
// whole point of a ban - whereas picks also have to answer to lane gaps,
// comfort, and the live matchup on the board.
const STAT_PRESENCE_WEIGHT_BAN = 55; // ban: rewards heroes that get touched (picked+banned) a lot at KWC
const STAT_WINRATE_WEIGHT_BAN = 50; // ban: rewards heroes with a proven high win rate, penalizes low ones
const STAT_PRESENCE_WEIGHT_PICK = 32;
const STAT_WINRATE_WEIGHT_PICK = 28;
const MIN_SAMPLE_GAMES = 5; // don't let a 2-game win rate swing the score - presence bonus still applies below this
const BLIND_PICK_STAT_MULTIPLIER = 1.6; // blind pick: tournament proof-of-strength matters even more with zero board info
const BLIND_PICK_EXPOSURE_PENALTY_PER_COUNTER = 6; // blind pick: small penalty per known hard counter, capped below
const BLIND_PICK_EXPOSURE_CAP = 5;

const COMFORT_BONUS = {
  standard: { super: 0, comfort: 0 },
  comfort: { super: 90, comfort: 45 },
};

// Shared tournament-stat scoring, used by both ban and pick phases with
// different weights. Returns { bonus, reasons } - reasons is an array of
// human-readable fragments to fold into the candidate's reason list.
function scoreTournamentStats(hero, { presenceWeight, winrateWeight, multiplier = 1 }) {
  const stats = tournamentStatsFor(hero.slug);
  if (!stats) return { bonus: 0, reasons: [] };

  let bonus = stats.presence * presenceWeight;
  const reasons = [];
  if (stats.presence > 0) {
    reasons.push(`${Math.round(stats.presence * 100)}% presence @ KWC 2026`);
  }
  if (stats.winRate != null && stats.picks >= MIN_SAMPLE_GAMES) {
    // Centered on 50% so a below-average win rate actively subtracts.
    bonus += (stats.winRate - 0.5) * 2 * winrateWeight;
    reasons.push(`${Math.round(stats.winRate * 100)}% WR (${stats.picks}g @ KWC)`);
  } else if (stats.winRate != null) {
    reasons.push(`${Math.round(stats.winRate * 100)}% WR (${stats.picks}g - small sample)`);
  }

  return { bonus: bonus * multiplier, reasons };
}

export function scoreBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const flexBonus = (hero.roles.length - 1) * FLEX_BONUS_PER_EXTRA_LANE;

  const { bonus: statBonus, reasons: statReasons } = scoreTournamentStats(hero, {
    presenceWeight: STAT_PRESENCE_WEIGHT_BAN,
    winrateWeight: STAT_WINRATE_WEIGHT_BAN,
  });

  const reasons = [`${hero.tier}-tier`];
  if (flexBonus > 0) reasons.push(`flexible · ${hero.roles.length} lanes`);
  reasons.push(...statReasons);

  return { hero, score: tierScore + flexBonus + statBonus, reasons };
}

// isBlindPick: true only for the very first pick of the whole draft (no
// enemy picks AND no team picks exist yet). Passed in explicitly by
// getSuggestions using lib/rankDraft's pickContext() so this file doesn't
// need to know about PICK_ORDER.
export function scorePickCandidate(
  hero,
  { filledLanes, algorithmMode, comfortLevel, enemyPickEntries, teamPickEntries, isBlindPick = false }
) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;

  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;

  const comfortWeights = COMFORT_BONUS[algorithmMode] || COMFORT_BONUS.standard;
  const comfortBonus = comfortLevel ? comfortWeights[comfortLevel] || 0 : 0;

  // Counters (merged HoKStats + community data)
  const { strongAgainst, counteredBy } = counterDataFor(hero.slug);
  const enemySlugs = (enemyPickEntries || []).map((p) => p.slug);
  const beats = enemySlugs.filter((slug) => strongAgainst.includes(slug));
  const beatenBy = enemySlugs.filter((slug) => counteredBy.includes(slug));
  const counterBonus = beats.length * COUNTER_BONUS_PER_HIT - beatenBy.length * COUNTER_PENALTY_PER_HIT;

  // Synergy (community-curated combos)
  const partners = synergyPartnersFor(hero.slug);
  const teamSlugs = (teamPickEntries || []).map((p) => p.slug);
  const synergizesWith = teamSlugs.filter((slug) => partners.has(slug));
  const synergyBonus = synergizesWith.length * SYNERGY_BONUS_PER_HIT;

  // Real tournament data - weighted up further on a true blind pick,
  // since it's the only signal available besides raw tier.
  const { bonus: statBonus, reasons: statReasons } = scoreTournamentStats(hero, {
    presenceWeight: STAT_PRESENCE_WEIGHT_PICK,
    winrateWeight: STAT_WINRATE_WEIGHT_PICK,
    multiplier: isBlindPick ? BLIND_PICK_STAT_MULTIPLIER : 1,
  });

  // Blind-pick exposure penalty: on the opening pick there's no board to
  // read, so a hero with a lot of known hard counters is a genuine risk
  // to reveal first - the enemy gets to draft around it with full info.
  let exposurePenalty = 0;
  if (isBlindPick && counteredBy.length > 0) {
    exposurePenalty = Math.min(counteredBy.length, BLIND_PICK_EXPOSURE_CAP) * BLIND_PICK_EXPOSURE_PENALTY_PER_COUNTER;
  }

  const reasons = [`${hero.tier}-tier`];
  if (gapBonus > 0) reasons.push(`fills ${missingCovered.join("/")}`);
  if (comfortBonus > 0) reasons.push(comfortLevel === "super" ? "Super Comfort" : "Comfort pick");
  if (beats.length > 0) {
    reasons.push(
      beats
        .map((s) => {
          const note = communityCounterNote(hero.slug, s);
          const name = heroBySlug(s)?.name || s;
          return note ? `counters ${name} (${note})` : `counters ${name}`;
        })
        .join(", ")
    );
  }
  if (beatenBy.length > 0) {
    const names = beatenBy.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push(`countered by ${names}`);
  }
  if (synergizesWith.length > 0) {
    const names = synergizesWith.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push(`synergizes with ${names}`);
  }
  reasons.push(...statReasons);
  if (isBlindPick) reasons.push("blind pick — leaning on proven strength");
  if (exposurePenalty > 0) reasons.push(`${counteredBy.length} known counter${counteredBy.length > 1 ? "s" : ""} — risky reveal`);

  const score = tierScore + gapBonus + comfortBonus + counterBonus + synergyBonus + statBonus - exposurePenalty;
  return { hero, score, reasons };
}

// Lanes already covered by a team's picks - based on the role EACH pick
// was actually drafted for, not the hero's full possible role list.
export function getFilledLanes(teamPickEntries) {
  const set = new Set();
  (teamPickEntries || []).forEach((entry) => {
    if (entry.role) set.add(entry.role);
  });
  return set;
}

// availableHeroes: heroes not yet banned/picked by anyone
// phase: "ban" | "pick"
// teamPickEntries: current team's picks so far, as [{slug, role}] (pick phase only)
// enemyPickEntries: opposing team's picks so far, as [{slug, role}] (pick phase only)
// algorithmMode: "standard" | "comfort"
// getComfortLevel: (hero) => null | "comfort" | "super"
// topN: how many ranked results to return - defaults to ALL eligible heroes
export function getSuggestions({
  availableHeroes,
  phase,
  teamPickEntries,
  enemyPickEntries,
  algorithmMode,
  getComfortLevel,
  topN = Infinity,
}) {
  if (phase === "ban") {
    return availableHeroes
      .map(scoreBanCandidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  if (phase === "pick") {
    const filledLanes = getFilledLanes(teamPickEntries);
    // True blind pick = nobody has picked anything yet on either side.
    // Given the app's snake PICK_ORDER this can only be Blue's opening
    // pick, but this check doesn't hardcode that - it just reads the
    // actual board, so it stays correct even if the order changes.
    const isBlindPick = (teamPickEntries || []).length === 0 && (enemyPickEntries || []).length === 0;
    // Hard exclusion: a hero with no lane left to fill is never suggested,
    // regardless of tier - e.g. once Mid is filled, no more Mid-only heroes.
    const eligible = availableHeroes.filter((hero) => hero.roles.some((r) => !filledLanes.has(r)));
    return eligible
      .map((hero) =>
        scorePickCandidate(hero, {
          filledLanes,
          algorithmMode,
          comfortLevel: getComfortLevel ? getComfortLevel(hero) : null,
          enemyPickEntries,
          teamPickEntries,
          isBlindPick,
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}