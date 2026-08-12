// Phase 1 + Phase 2 AI suggestion engine.
//
// Factors in: hero tier, lane flexibility (bans), your team's empty-lane
// gaps (picks), your Comfort/Super Comfort profile (picks, comfort mode
// only), and now real counter-pick data (picks) - does the candidate beat
// an already-picked enemy hero, or does the enemy already have an answer
// to the candidate?
//
// Still NOT factored in: team synergy, real win/pick/ban-rate stats,
// damage-type/CC balance. Counter data covers 94 of 116 heroes (HoKStats
// coverage) - heroes without evidence simply get zero counter bonus,
// they aren't penalized or guessed at.

import { heroBySlug, counterDataFor } from "./heroes";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
const GAP_BONUS_PER_LANE = 35; // pick phase: rewards filling a lane your team has none of yet
const COUNTER_BONUS_PER_HIT = 30; // pick phase: candidate beats an already-picked enemy hero
const COUNTER_PENALTY_PER_HIT = 20; // pick phase: an already-picked enemy hero beats the candidate

const COMFORT_BONUS = {
  standard: { super: 0, comfort: 0 },
  comfort: { super: 90, comfort: 45 },
};

export function scoreBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const flexBonus = (hero.roles.length - 1) * FLEX_BONUS_PER_EXTRA_LANE;

  const reasons = [`${hero.tier}-tier`];
  if (flexBonus > 0) reasons.push(`flexible · ${hero.roles.length} lanes`);

  return { hero, score: tierScore + flexBonus, reasons };
}

export function scorePickCandidate(hero, { filledLanes, algorithmMode, comfortLevel, enemyPicks }) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;

  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;

  const comfortWeights = COMFORT_BONUS[algorithmMode] || COMFORT_BONUS.standard;
  const comfortBonus = comfortLevel ? comfortWeights[comfortLevel] || 0 : 0;

  const { strongAgainst, counteredBy } = counterDataFor(hero.slug);
  const enemySlugs = enemyPicks || [];
  const beats = enemySlugs.filter((slug) => strongAgainst.includes(slug));
  const beatenBy = enemySlugs.filter((slug) => counteredBy.includes(slug));
  const counterBonus = beats.length * COUNTER_BONUS_PER_HIT - beatenBy.length * COUNTER_PENALTY_PER_HIT;

  const reasons = [`${hero.tier}-tier`];
  if (gapBonus > 0) reasons.push(`fills ${missingCovered.join("/")}`);
  if (comfortBonus > 0) reasons.push(comfortLevel === "super" ? "Super Comfort" : "Comfort pick");
  if (beats.length > 0) {
    const names = beats.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push(`counters ${names}`);
  }
  if (beatenBy.length > 0) {
    const names = beatenBy.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push(`countered by ${names}`);
  }

  return { hero, score: tierScore + gapBonus + comfortBonus + counterBonus, reasons };
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
// teamPicks: current team's picked slugs so far (only used for "pick")
// enemyPicks: opposing team's picked slugs so far (only used for "pick")
// algorithmMode: "standard" | "comfort"
// getComfortLevel: (hero) => null | "comfort" | "super"
export function getSuggestions({ availableHeroes, phase, teamPicks, enemyPicks, algorithmMode, getComfortLevel, topN = 3 }) {
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
          enemyPicks,
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}