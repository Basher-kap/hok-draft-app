// Phase 1 AI suggestion engine.
//
// What this DOES factor in: hero tier, lane flexibility (bans), your
// team's empty-lane gaps (picks), and your Comfort/Super Comfort profile
// (picks, only when Algorithm mode = "comfort").
//
// What this does NOT factor in yet (needs more data): counter-picks,
// team synergy, real win/pick/ban-rate stats, damage-type/CC balance.
// Suggestions are a reasonable heuristic, not a guarantee.

import { heroBySlug } from "./heroes";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
const GAP_BONUS_PER_LANE = 35; // pick phase: rewards filling a lane your team has none of yet

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

export function scorePickCandidate(hero, { filledLanes, algorithmMode, comfortLevel }) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;
  const comfortWeights = COMFORT_BONUS[algorithmMode] || COMFORT_BONUS.standard;
  const comfortBonus = comfortLevel ? comfortWeights[comfortLevel] || 0 : 0;

  const reasons = [`${hero.tier}-tier`];
  if (gapBonus > 0) reasons.push(`fills ${missingCovered.join("/")}`);
  if (comfortBonus > 0) reasons.push(comfortLevel === "super" ? "Super Comfort" : "Comfort pick");

  return { hero, score: tierScore + gapBonus + comfortBonus, reasons };
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
// algorithmMode: "standard" | "comfort"
// getComfortLevel: (hero) => null | "comfort" | "super"
export function getSuggestions({ availableHeroes, phase, teamPicks, algorithmMode, getComfortLevel, topN = 3 }) {
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
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}
