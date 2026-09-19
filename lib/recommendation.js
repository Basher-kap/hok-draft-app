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
// Still NOT factored in: real win/pick/ban-rate stats for Tournament
// Draft picks (lib/tournamentMeta.js is still empty - see that file).
// Rank Draft's pick scoring DOES factor in ranked-ladder win/pick rate
// once mode: "rank" is passed to getSuggestions() (see lib/rankedMeta.js).
// Counter/synergy data has real gaps (not every hero has evidence) - heroes without it
// simply get zero bonus, never penalized or guessed at. Archetype
// coverage isn't total either (a handful of heroes have no listed
// archetype for a given lane) - those heroes just don't contribute to
// composition bonuses/penalties for that lane, they're never guessed at.
//
// Each reason is { text, type }, type is "info" (the tier line - neutral
// context, not a score driver) | "positive" (a bonus) | "warning" (a
// penalty - currently: countered by an already-picked enemy hero, or
// piling onto an already damage-heavy team). The UI uses `type` to flag
// warnings visually instead of burying them in a wall of plain text -
// a hero can still rank highly overall (tier + gaps + synergy can easily
// outweigh one counter) while still carrying a real risk worth flagging.

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
// Rank Draft's own base score - HOK Camp's "official popularity" band
// (S/A/B/C, see lib/rankedMeta.js) instead of the generic tier. Only 4
// levels since that's all the source page has; a hero without a band yet
// falls back to TIER_SCORE[hero.tier] (see scoreRankedBanCandidate /
// scorePickCandidate below).
const RANKED_TIER_SCORE = { S: 100, A: 80, B: 60, C: 40 };
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

// Pick-phase meta weights (mirrors the ban-phase ones above, applied to
// the same normalized 0-100 values). Ban rate is left out here - it's a
// meaningful "is this worth banning" signal but says nothing about
// whether picking it is a good idea. Win rate matters more than pick
// rate for a pick decision, so it gets more of the weight.
const PICK_WIN_RATE_WEIGHT = 0.6;
const PICK_PICK_RATE_WEIGHT = 0.4;

// Manual Super Comfort / Comfort system (components/ComfortProvider.jsx,
// the "MANUAL" tab on /comfort-picks) - back in suggestion scoring,
// gated behind the "comfort" algorithm toggle same as before.
const COMFORT_BONUS = {
  standard: { super: 0, comfort: 0 },
  comfort: { super: 90, comfort: 45 },
};

// Comfort-hero tiering (lib/comfortHeroes.js, data/comfort-heroes.json,
// editable from the "TIER MODEL" tab on /comfort-picks via
// components/ComfortTierProvider.jsx). Gated behind the same "comfort"
// algorithm toggle as the manual system above - standard mode zeroes it
// out, comfort mode weights it heavily in Tournament Draft and lighter in
// Rank Draft, where real ladder meta already dominates.
//
// The tier assignments carry real pick-timing/context meaning (per
// Basher):
//   priority - first-pick contenders, the core of the draft
//   reserve  - second to priority; still a strong 1st pick, and a
//              comfort fallback
//   common   - fine around the 3rd/4th pick (2nd on red side) - solid
//              but not build-around
//   adjust   - 4th/5th pick, taken specifically to counter something or
//              complete the lineup synergy already on the board
//   wildcard - super-comfort pool, picked whenever the moment calls for
//              it - not tied to a pick number, but tied to actually
//              countering or synergizing with the live draft
// comfortTierMultiplier() below leans into that: priority/reserve/common
// get full value near their intended pick number and a reduced value
// off it; adjust/wildcard get full value only when this candidate
// actually has a real counter or synergy hit this turn (beats.length or
// synergizesWith.length > 0) - otherwise they're being picked "on vibes"
// rather than for the reason the tier exists, so they're worth less.
const TOURNAMENT_COMFORT_TIER_BONUS = {
  standard: { priority: 0, reserve: 0, common: 0, adjust: 0, wildcard: 0 },
  comfort: { priority: 70, reserve: 50, common: 28, adjust: 14, wildcard: 8 },
};
const RANKED_COMFORT_TIER_BONUS = {
  standard: { priority: 0, reserve: 0, common: 0, adjust: 0, wildcard: 0 },
  comfort: { priority: 35, reserve: 24, common: 14, adjust: 7, wildcard: 4 },
};

// Multiplier applied to the base comfort-tier bonus above, based on
// whether this pick is happening "on curve" for the tier's intended
// timing/context. `pickNumber` is this team's own pick count so far + 1
// (1-indexed - "1" means this would be their first pick of the draft).
// `hasSituationalHit` is true when the candidate actually counters an
// enemy pick or synergizes with a teammate pick already on the board.
function comfortTierMultiplier(tier, { pickNumber, hasSituationalHit }) {
  switch (tier) {
    case "priority":
      return pickNumber === 1 ? 1 : 0.6;
    case "reserve":
      return pickNumber <= 2 ? 1 : 0.7;
    case "common":
      return pickNumber >= 2 && pickNumber <= 4 ? 1 : 0.85;
    case "adjust":
      if (!hasSituationalHit) return 0.35;
      return pickNumber >= 4 ? 1 : 0.7;
    case "wildcard":
      return hasSituationalHit ? 1 : 0.35;
    default:
      return 1;
  }
}

// Rank Draft-only ban weights - see lib/rankedMeta.js. These apply to the
// NORMALIZED (0-100, relative to the current roster) versions of ban/win/
// pick rate, not the raw percentages - the weights sum to 1, so the
// ranked-meta bonus tops out around 100, putting it in the same ballpark
// as tier score (also 0-100) rather than being swamped by it or swamping
// it. Ban rate is weighted heaviest since it's the most direct "what's
// actually worth banning" signal; win rate next; pick rate least (mostly
// a tiebreaker - a heavily-picked hero is more likely to be contested
// even if its win rate is unremarkable).
const RANKED_BAN_RATE_WEIGHT = 0.5;
const RANKED_WIN_RATE_WEIGHT = 0.3;
const RANKED_PICK_RATE_WEIGHT = 0.2;

// Plain tier ban score, with no meta-stats blended in. Kept as a
// reference/building-block function - scoreRankedBanCandidate and
// scoreTournamentBanCandidate both start from this same base and add
// their own data source on top. Not currently called directly by either
// draft mode.
export function scoreBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;

  const reasons = [{ text: `${hero.tier}-tier`, type: "info" }];

  return { hero, score: tierScore, reasons };
}

// Rank Draft's ban-phase scorer - a genuinely different algorithm from
// Tournament's, not just a bonus bolted onto the same base: the base
// score itself comes from HOK Camp's ranked-popularity band (S/A/B/C,
// lib/rankedMeta.js) instead of the generic tier, then blends in real
// ranked-ladder ban/win/pick rate on top. Falls back to the generic tier
// only for a hero with no ranked meta entry yet.
export function scoreRankedBanCandidate(hero) {
  const meta = normalizedRankedMetaFor(hero.slug);
  // Base score comes from the ranked-ladder popularity band when we have
  // one for this hero; otherwise fall back to the generic tier exactly
  // like before this data existed.
  const tierScore = meta ? RANKED_TIER_SCORE[meta.band] ?? 0 : TIER_SCORE[hero.tier] ?? 0;

  const reasons = meta
    ? [{ text: `${meta.band}-band (ranked popularity)`, type: "info" }]
    : [{ text: `${hero.tier}-tier`, type: "info" }];

  let rankedBonus = 0;
  if (meta) {
    rankedBonus =
      meta.banRate * RANKED_BAN_RATE_WEIGHT +
      meta.winRate * RANKED_WIN_RATE_WEIGHT +
      meta.pickRate * RANKED_PICK_RATE_WEIGHT;
    reasons.push({
      text: `${meta.raw.banRate}% ban rate · ${meta.raw.winRate}% win rate · ${meta.raw.pickRate}% pick rate`,
      type: "positive",
    });
  }

  return { hero, score: tierScore + rankedBonus, reasons };
}

// Tournament Draft's ban-phase scorer - same idea as
// scoreRankedBanCandidate, but pulls from lib/tournamentMeta.js (pro/
// tournament-scene ban/win/pick rate, e.g. KWC 2026) instead of the
// ranked ladder. While that file is still empty (awaiting data), this
// behaves identically to scoreBanCandidate - tier + lane-flexibility
// only - so Tournament Draft's suggestions won't change until real
// numbers are populated.
const TOURNAMENT_BAN_RATE_WEIGHT = 0.5;
const TOURNAMENT_WIN_RATE_WEIGHT = 0.3;
const TOURNAMENT_PICK_RATE_WEIGHT = 0.2;

export function scoreTournamentBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;

  const reasons = [{ text: `${hero.tier}-tier`, type: "info" }];

  const meta = normalizedTournamentMetaFor(hero.slug);
  let tournamentBonus = 0;
  if (meta) {
    tournamentBonus =
      meta.banRate * TOURNAMENT_BAN_RATE_WEIGHT +
      meta.winRate * TOURNAMENT_WIN_RATE_WEIGHT +
      meta.pickRate * TOURNAMENT_PICK_RATE_WEIGHT;
    reasons.push({
      text: `${meta.raw.banRate}% ban rate · ${meta.raw.winRate}% win rate · ${meta.raw.pickRate}% pick rate (pro)`,
      type: "positive",
    });
  }

  return { hero, score: tierScore + tournamentBonus, reasons };
}

export function scorePickCandidate(hero, { filledLanes, algorithmMode, comfortLevel, getComfortTier, enemyPickEntries, teamPickEntries, mode = "tournament" }) {
  // Meta lookup happens first now - Rank Draft's base score comes from
  // the ranked popularity band (see RANKED_TIER_SCORE), not the generic
  // tier, when we have one for this hero.
  const metaLookup = mode === "rank" ? normalizedRankedMetaFor : normalizedTournamentMetaFor;
  const meta = metaLookup(hero.slug);
  const tierScore =
    mode === "rank" && meta ? RANKED_TIER_SCORE[meta.band] ?? 0 : TIER_SCORE[hero.tier] ?? 0;

  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;

  const comfortWeights = COMFORT_BONUS[algorithmMode] || COMFORT_BONUS.standard;
  const comfortBonus = comfortLevel ? comfortWeights[comfortLevel] || 0 : 0;

  // Best comfort tier across every lane this hero could still fill -
  // `getComfortTier` lets a caller inject the user's own edited tier
  // assignments (components/ComfortTierProvider.jsx); falls back to the
  // shipped default data (lib/comfortHeroes.js) when not provided. Picked
  // by tier order (priority beats reserve beats common...), which also
  // happens to match weight order in both COMFORT_TIER_BONUS tables.
  let comfortTierHit = null;
  missingCovered.forEach((lane) => {
    const tier = getComfortTier ? getComfortTier(lane, hero.slug) : comfortTierFor(lane, hero.slug);
    if (!tier) return;
    if (!comfortTierHit || COMFORT_TIER_ORDER.indexOf(tier) < COMFORT_TIER_ORDER.indexOf(comfortTierHit.tier)) {
      comfortTierHit = { lane, tier };
    }
  });

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

  // Comfort-tier bonus, scaled by how "on curve" this pick is for the
  // tier (see comfortTierMultiplier() above) - needs beats/synergizesWith,
  // so it's computed here rather than up with comfortTierHit.
  let comfortTierBonus = 0;
  let comfortTierOffCurve = false;
  if (comfortTierHit) {
    const tierBonusTable = mode === "rank" ? RANKED_COMFORT_TIER_BONUS : TOURNAMENT_COMFORT_TIER_BONUS;
    const comfortTierWeights = tierBonusTable[algorithmMode] || tierBonusTable.standard;
    const baseBonus = comfortTierWeights[comfortTierHit.tier] || 0;
    const pickNumber = (teamPickEntries || []).length + 1;
    const hasSituationalHit = beats.length > 0 || synergizesWith.length > 0;
    const multiplier = comfortTierMultiplier(comfortTierHit.tier, { pickNumber, hasSituationalHit });
    comfortTierBonus = baseBonus * multiplier;
    comfortTierOffCurve = multiplier < 1;
  }

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
      compositionReasons.push({ text: `gives your team a frontline (${tankLane.role})`, type: "positive" });
    }
  }

  if (teamComp.cc === 0) {
    const ccLane = candidateCategoriesByLane.find((c) => c.cc);
    if (ccLane) {
      compositionBonus += NO_CC_BONUS;
      compositionReasons.push({ text: `brings CC your team is missing (${ccLane.role})`, type: "positive" });
    }
  }

  if (teamComp.Damage >= DAMAGE_OVERSTACK_THRESHOLD) {
    const pureDamageOnly = candidateCategoriesByLane.every(
      (c) => c.categories.length > 0 && c.categories.every((cat) => cat === "Damage") && !c.cc
    );
    if (pureDamageOnly && candidateCategoriesByLane.length > 0) {
      compositionBonus -= DAMAGE_OVERSTACK_PENALTY;
      compositionReasons.push({ text: `your team already has ${teamComp.Damage} pure-damage picks`, type: "warning" });
    }
  }

  if (enemyComp.Tank >= ENEMY_HEAVY_THRESHOLD) {
    const antiTankLane = candidateCategoriesByLane.find((c) => c.antiTank);
    if (antiTankLane) {
      compositionBonus += ANTI_TANK_BONUS;
      compositionReasons.push({ text: `shreds through their ${enemyComp.Tank} tanks (${antiTankLane.role})`, type: "positive" });
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
    reasons.push({
      text: beats
        .map((s) => {
          const note = communityCounterNote(hero.slug, s);
          const name = heroBySlug(s)?.name || s;
          return note ? `counters ${name} (${note})` : `counters ${name}`;
        })
        .join(", "),
      type: "positive",
    });
  }
  if (beatenBy.length > 0) {
    const names = beatenBy.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push({ text: `countered by ${names}`, type: "warning" });
  }
  if (synergizesWith.length > 0) {
    const names = synergizesWith.map((s) => heroBySlug(s)?.name || s).join(", ");
    reasons.push({ text: `synergizes with ${names}`, type: "positive" });
  }
  compositionReasons.forEach((r) => reasons.push(r));

  return {
    hero,
    score: tierScore + gapBonus + comfortBonus + comfortTierBonus + counterBonus + synergyBonus + compositionBonus + metaBonus,
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
// getComfortTier: (lane, slug) => null | "priority" | "reserve" | "common" |
//   "adjust" | "wildcard" - the comfort-tier model (pick phase only). Pass
//   useComfortTier()'s `tierFor` here to use the user's edited
//   assignments; omitted, scorePickCandidate falls back to the shipped
//   default data (lib/comfortHeroes.js). Gated behind the same
//   algorithmMode toggle as the manual Super Comfort/Comfort system -
//   "standard" zeroes out both, "comfort" weights both.
// topN: how many ranked results to return - defaults to ALL eligible heroes
// mode: "tournament" (default) | "rank" - selects the meta data source
//   for BOTH ban and pick scoring. Rank Draft passes "rank" to blend in
//   ranked-ladder stats (lib/rankedMeta.js - ban/win/pick rate for bans,
//   win/pick rate for picks); Tournament Draft leaves this as the
//   default, which uses pro/tournament-scene meta (lib/tournamentMeta.js)
//   once populated. Either way, a hero with no meta entry yet just gets
//   no bonus - behavior is unchanged from before either data source
//   existed until real numbers are filled in.
export function getSuggestions({
  availableHeroes,
  phase,
  teamPickEntries,
  enemyPickEntries,
  algorithmMode,
  getComfortLevel,
  getComfortTier,
  topN = Infinity,
  mode = "tournament",
}) {
  if (phase === "ban") {
    const banScorer = mode === "rank" ? scoreRankedBanCandidate : scoreTournamentBanCandidate;
    return availableHeroes
      .map(banScorer)
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
          getComfortTier,
          enemyPickEntries,
          teamPickEntries,
          mode,
        })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
  return [];
}