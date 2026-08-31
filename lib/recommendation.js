// Phase 1 + Phase 2 AI suggestion engine.
//
// Factors in: hero tier, lane flexibility (bans), your team's empty-lane
// gaps (picks - based on the ACTUAL role each pick was drafted for, not
// a flex hero's full role list), your Comfort/Super Comfort profile
// (picks, comfort mode only), real counter-pick data (picks - merged
// from HoKStats' Counters Explorer + a community-curated set with extra
// off-role matchups), team synergy (picks - community-curated combos of
// heroes that work well together), and composition/damage-type balance
// (picks - per-lane hero archetypes from TYPES OF HEROES.txt, rolled up
// into Tank / Semi-Tank / Damage / Utility plus damage range and a CC flag).
//
// Composition logic (pick phase only - all 6 bans happen before any picks
// in Rank Draft, so there's no lineup yet to react to at ban time):
// The engine steers your team toward one of the four balanced lineups from
// TYPES OF_HEROES.txt:
//   1) 2 Tanks, 2 Damage (Long + Short), 1 Semi-Tank
//   2) 2 Semi-Tanks, 2 Damage (Long + Short), 1 Semi-Tank Support
//   3) 3 Damage (2 Short + 1 Long), 1 Tank, 1 Semi-Tank
//   4) 3 Damage (2 Short + 1 Long), 2 Tanks
// At each pick it scores the candidate against the closest still-reachable
// balanced shape, rewarding heroes that fill a missing role and penalizing
// heroes that overstack a role already covered. It also keeps the
// "long + short" damage pairing intact (no team wants 3 long-range and 0
// short-range damage), and reacts to the enemy comp (anti-tank when they
// stack Heavy, frontline/CC when your team is missing them).
//
// Hard rule: if every lane a hero can play is already filled on your
// team, that hero is dropped from suggestions entirely - not just
// deprioritized. A flex hero who can still fill an open lane stays
// suggestible.
//
// Still NOT factored in: real win/pick/ban-rate stats. Counter/synergy
// data has real gaps (not every hero has evidence) - heroes without it
// simply get zero bonus, never penalized or guessed at. Archetype
// coverage isn't total either (a handful of heroes have no listed
// archetype for a given lane) - those heroes just don't contribute to
// composition bonuses/penalties for that lane, they're never guessed at.

import { heroBySlug, counterDataFor, communityCounterNote, synergyPartnersFor } from "./heroes";
import {
  broadCategoriesForHero,
  heroHasCC,
  heroIsAntiTank,
  heroDamageRanges,
  primaryContribution,
  compositionSummary,
} from "./heroArchetypes";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
const GAP_BONUS_PER_LANE = 35; // pick phase: rewards filling a lane your team has none of yet
const COUNTER_BONUS_PER_HIT = 30; // pick phase: candidate beats an already-picked enemy hero
const COUNTER_PENALTY_PER_HIT = 20; // pick phase: an already-picked enemy hero beats the candidate
const SYNERGY_BONUS_PER_HIT = 22; // pick phase: candidate pairs well with an already-picked teammate

// Composition scoring weights.
const LINEUP_FILL_BONUS = 38; // candidate fills a role the closest balanced lineup still needs
const LINEUP_OVERSTACK_PENALTY = 30; // candidate overstacks a role the closest lineup already has covered
const NO_FRONTLINE_BONUS = 28; // team has 0 Tank picks and this hero can play Heavy in an open lane
const NO_CC_BONUS = 24; // team has 0 CC picks and this hero brings CC in an open lane
const DAMAGE_OVERSTACK_PENALTY = 18; // team already has 3+ pure-Damage picks, this hero adds only more
const ANTI_TANK_BONUS = 20; // enemy has 2+ Heavy tanks and this hero shreds through them
const DAMAGE_RANGE_BALANCE_BONUS = 20; // candidate brings the missing long- or short-range damage
const DAMAGE_RANGE_OVERSTACK_PENALTY = 16; // candidate stacks a damage range the team already has too much of
const DAMAGE_OVERSTACK_THRESHOLD = 3;
const ENEMY_HEAVY_THRESHOLD = 2;
const TEAM_SIZE = 5;

// The four balanced lineup templates from TYPES OF_HEROES.txt. Each is a
// count of broad-category contributions (Tank / Semi-Tank / Damage / Utility,
// where Utility = Semi-Tank Support) that sums to 5. The engine picks the
// closest still-reachable template given your team's picks so far and
// scores candidates against it.
const BALANCED_LINEUPS = [
  { Tank: 2, "Semi-Tank": 1, Damage: 2, Utility: 0, label: "2 Tanks · 2 Damage · 1 Semi-Tank" },
  { Tank: 0, "Semi-Tank": 2, Damage: 2, Utility: 1, label: "2 Semi-Tanks · 2 Damage · 1 Support" },
  { Tank: 1, "Semi-Tank": 1, Damage: 3, Utility: 0, label: "3 Damage · 1 Tank · 1 Semi-Tank" },
  { Tank: 2, "Semi-Tank": 0, Damage: 3, Utility: 0, label: "3 Damage · 2 Tanks" },
];

// How many picks are left for your team after this one (including it).
function picksRemaining(teamPickEntries) {
  return Math.max(0, TEAM_SIZE - (teamPickEntries || []).length);
}

// Given the team's composition so far, returns the balanced lineup template
// that's still reachable (team hasn't exceeded any role count) and needs the
// fewest picks to complete. If none is reachable, returns the one that's
// "least over" so the engine still steers back toward balance.
function closestBalancedLineup(teamComp) {
  const remaining = TEAM_SIZE - teamComp.total;
  let best = null;
  let bestCost = Infinity;
  for (const template of BALANCED_LINEUPS) {
    let reachable = true;
    let cost = 0;
    for (const key of ["Tank", "Semi-Tank", "Damage", "Utility"]) {
      const have = teamComp[key] || 0;
      const need = template[key] || 0;
      if (have > need) reachable = false;
      cost += Math.max(0, need - have);
      cost += (have - need) * 2; // overstacking is worse than underfilling
    }
    if (reachable && cost < bestCost) {
      best = template;
      bestCost = cost;
    }
  }
  if (best) return best;
  // Fallback: least-bad template (smallest total overstack across roles).
  let fallback = BALANCED_LINEUPS[0];
  let fallbackCost = Infinity;
  for (const template of BALANCED_LINEUPS) {
    let cost = 0;
    for (const key of ["Tank", "Semi-Tank", "Damage", "Utility"]) {
      cost += Math.max(0, (teamComp[key] || 0) - (template[key] || 0));
    }
    if (cost < fallbackCost) {
      fallbackCost = cost;
      fallback = template;
    }
  }
  return fallback;
}

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

export function scorePickCandidate(hero, { filledLanes, algorithmMode, comfortLevel, enemyPickEntries, teamPickEntries }) {
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

  // Composition / damage-type balance. `missingCovered` is every lane this
  // hero could still fill - a hero only earns a composition bonus if ONE
  // of those open lanes is where it plays the relevant archetype (e.g. a
  // Farm-only hero doesn't get credit for "would be a Heavy" just because
  // some other lane's version of them is tanky - they can't actually be
  // drafted into that lane).
  const teamComp = compositionSummary(teamPickEntries);
  const enemyComp = compositionSummary(enemyPickEntries);

  const candidateCategoriesByLane = missingCovered.map((r) => ({
    role: r,
    categories: broadCategoriesForHero(hero.slug, r),
    primary: primaryContribution(hero.slug, r),
    cc: heroHasCC(hero.slug, r),
    antiTank: heroIsAntiTank(hero.slug, r),
    ranges: heroDamageRanges(hero.slug, r),
  }));

  let compositionBonus = 0;
  const compositionReasons = [];

  // --- Balanced lineup targeting -----------------------------------------
  // Score the candidate against the closest still-reachable balanced
  // lineup. If the candidate's primary contribution in an open lane fills
  // a role that lineup still needs, reward it; if it overstacks a role the
  // lineup already has full, penalize it.
  const targetLineup = closestBalancedLineup(teamComp);
  const remaining = picksRemaining(teamPickEntries);

  candidateCategoriesByLane.forEach((lane) => {
    const contribution = lane.primary;
    if (!contribution) return;
    const have = teamComp[contribution] || 0;
    const need = targetLineup[contribution] || 0;
    if (have < need) {
      compositionBonus += LINEUP_FILL_BONUS;
      compositionReasons.push(`fills ${contribution} for ${targetLineup.label} (${lane.role})`);
    } else if (have >= need && remaining <= need - have + 1) {
      // Overstacking a role the lineup considers full, with few picks left
      compositionBonus -= LINEUP_OVERSTACK_PENALTY;
      compositionReasons.push(`overstacks ${contribution} (${targetLineup.label})`);
    }
  });

  // --- Frontline / CC / damage overstack (existing checks, kept) ----------
  if (teamComp.Tank === 0) {
    const tankLane = candidateCategoriesByLane.find((c) => c.categories.includes("Tank"));
    if (tankLane) {
      compositionBonus += NO_FRONTLINE_BONUS;
      compositionReasons.push(`gives your team a frontline (${tankLane.role})`);
    }
  }

  if (teamComp.cc === 0) {
    const ccLane = candidateCategoriesByLane.find((c) => c.cc);
    if (ccLane) {
      compositionBonus += NO_CC_BONUS;
      compositionReasons.push(`brings CC your team is missing (${ccLane.role})`);
    }
  }

  if (teamComp.Damage >= DAMAGE_OVERSTACK_THRESHOLD) {
    const pureDamageOnly = candidateCategoriesByLane.every(
      (c) => c.categories.length > 0 && c.categories.every((cat) => cat === "Damage") && !c.cc
    );
    if (pureDamageOnly && candidateCategoriesByLane.length > 0) {
      compositionBonus -= DAMAGE_OVERSTACK_PENALTY;
      compositionReasons.push(`your team already has ${teamComp.Damage} pure-damage picks`);
    }
  }

  if (enemyComp.Tank >= ENEMY_HEAVY_THRESHOLD) {
    const antiTankLane = candidateCategoriesByLane.find((c) => c.antiTank);
    if (antiTankLane) {
      compositionBonus += ANTI_TANK_BONUS;
      compositionReasons.push(`shreds through their ${enemyComp.Tank} tanks (${antiTankLane.role})`);
    }
  }

  // --- Damage range balance (Long + Short) -------------------------------
  // Every balanced lineup wants both a long-range and a short-range damage
  // source. Reward a candidate that brings the missing range; penalize one
  // that stacks a range the team is already heavy on.
  const teamLong = teamComp.longDamage;
  const teamShort = teamComp.shortDamage;
  const candidateLong = candidateCategoriesByLane.some((c) => c.ranges.includes("long"));
  const candidateShort = candidateCategoriesByLane.some((c) => c.ranges.includes("short"));

  if (candidateLong && teamLong === 0 && teamShort > 0) {
    compositionBonus += DAMAGE_RANGE_BALANCE_BONUS;
    compositionReasons.push("adds long-range damage your team lacks");
  }
  if (candidateShort && teamShort === 0 && teamLong > 0) {
    compositionBonus += DAMAGE_RANGE_BALANCE_BONUS;
    compositionReasons.push("adds short-range damage your team lacks");
  }
  if (candidateLong && teamLong >= 2 && teamShort === 0) {
    compositionBonus -= DAMAGE_RANGE_OVERSTACK_PENALTY;
    compositionReasons.push("stacks more long-range damage when you need short-range");
  }
  if (candidateShort && teamShort >= 3 && teamLong === 0) {
    compositionBonus -= DAMAGE_RANGE_OVERSTACK_PENALTY;
    compositionReasons.push("stacks more short-range damage when you need long-range");
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
  compositionReasons.forEach((r) => reasons.push(r));

  return {
    hero,
    score: tierScore + gapBonus + comfortBonus + counterBonus + synergyBonus + compositionBonus,
    reasons,
  };
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
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}