// Phase 1 + Phase 2 AI suggestion engine.
//
// Factors in: hero tier, real ban/win/pick-rate meta (bans, Rank/
// Tournament mode-specific - see lib/rankedMeta.js / lib/tournamentMeta.js),
// your team's empty-lane gaps (picks - based on the ACTUAL role each pick
// was drafted for, not a flex hero's full role list), your Comfort/Super
// Comfort profile (picks, comfort mode only), real counter-pick data
// (picks - merged from HoKStats' Counters Explorer + a community-curated
// set with extra off-role matchups), team synergy (picks - community-
// curated combos of heroes that work well together), and now composition/
// damage-type balance (picks - per-lane hero archetypes from TYPES OF
// HEROES.txt: Heavy/Hybrid/Damage/Assassin/Lockdown/Buff/Support/Control/
// Artillery/Range/Shredd/Kits, rolled up into Tank / Semi-Tank / Damage /
// Utility plus a crowd-control flag).
//
// NOT factored in: lane flexibility (a hero's number of playable lanes)
// no longer gives a ban-phase bonus - removed on request.
//
// Composition logic (pick phase only - all 6 bans happen before any picks
// in Rank Draft, so there's no lineup yet to react to at ban time):
//   - No frontline yet (0 Tank picks) → bump heroes who'd play Heavy in
//     one of their fillable lanes.
//   - No CC yet (0 heroes flagged cc) → bump heroes who bring lockdown/
//     control/support-style CC in a fillable lane.
//   - Already 3+ pure-Damage picks → nudge down another damage-only hero
//     with nothing else to offer (no tank/CC/utility contribution).
//   - Enemy is stacking Heavy tanks (2+) → bump anti-tank (Shredd) heroes
//     that shred through a beefy frontline.
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
import { broadCategoriesForHero, heroHasCC, heroIsAntiTank, compositionSummary } from "./heroArchetypes";
import { normalizedRankedMetaFor } from "./rankedMeta";
import { normalizedTournamentMetaFor } from "./tournamentMeta";
import { comfortTierFor, COMFORT_TIER_LABELS } from "./comfortHeroes";

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

const NO_FRONTLINE_BONUS = 28; // team has 0 Tank picks and this hero can play Heavy in an open lane
const NO_CC_BONUS = 24; // team has 0 CC picks and this hero brings CC in an open lane
const DAMAGE_OVERSTACK_PENALTY = 18; // team already has 3+ pure-Damage picks, this hero adds only more
const ANTI_TANK_BONUS = 20; // enemy has 2+ Heavy tanks and this hero shreds through them
const DAMAGE_OVERSTACK_THRESHOLD = 3;
const ENEMY_HEAVY_THRESHOLD = 2;

// Pick-phase meta weights (mirrors the ban-phase ones above, applied to
// the same normalized 0-100 values). Ban rate is left out here - it's a
// meaningful "is this worth banning" signal but says nothing about
// whether picking it is a good idea. Win rate matters more than pick
// rate for a pick decision, so it gets more of the weight.
const PICK_WIN_RATE_WEIGHT = 0.6;
const PICK_PICK_RATE_WEIGHT = 0.4;

// The manual Super Comfort / Comfort system (components/ComfortProvider.jsx,
// the "MANUAL" tab on /comfort-picks) is no longer part of AI suggestion
// scoring - it now only drives the visual badge/border on hero cards. The
// tier model below (Priority/Reserve/Common/Adjust/Wildcard) is the sole
// comfort signal in the algorithm.

// Comfort-hero tiering (lib/comfortHeroes.js, data/comfort-heroes.json,
// editable from the "TIER MODEL" tab on /comfort-picks via
// components/ComfortTierProvider.jsx) - the only comfort signal factored
// into suggestion scoring. Weighted heavily in Tournament Draft (where
// this model is meant to matter most) and present but lighter in Rank
// Draft, where real ladder meta (win/pick/ban rate) is already the
// dominant signal.
const TOURNAMENT_COMFORT_TIER_BONUS = { priority: 70, reserve: 50, common: 28, adjust: 14, wildcard: 8 };
const RANKED_COMFORT_TIER_BONUS = { priority: 35, reserve: 24, common: 14, adjust: 7, wildcard: 4 };

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

export function scorePickCandidate(hero, { filledLanes, getComfortTier, enemyPickEntries, teamPickEntries, mode = "tournament" }) {
  // Meta lookup happens first now - Rank Draft's base score comes from
  // the ranked popularity band (see RANKED_TIER_SCORE), not the generic
  // tier, when we have one for this hero.
  const metaLookup = mode === "rank" ? normalizedRankedMetaFor : normalizedTournamentMetaFor;
  const meta = metaLookup(hero.slug);
  const tierScore =
    mode === "rank" && meta ? RANKED_TIER_SCORE[meta.band] ?? 0 : TIER_SCORE[hero.tier] ?? 0;

  const missingCovered = hero.roles.filter((r) => !filledLanes.has(r));
  const gapBonus = missingCovered.length * GAP_BONUS_PER_LANE;

  // Comfort-tier bonus - the only comfort signal in scoring now (see the
  // note above COMFORT_TIER_BONUS consts). Checked against every lane this
  // hero could still fill - if it's a comfort tier in more than one open
  // lane, the best (highest-priority) tier wins. `getComfortTier` lets a
  // caller inject the user's own edited tier assignments
  // (components/ComfortTierProvider.jsx); falls back to the shipped
  // default data (lib/comfortHeroes.js) when not provided.
  const comfortTierWeights = mode === "rank" ? RANKED_COMFORT_TIER_BONUS : TOURNAMENT_COMFORT_TIER_BONUS;
  let comfortTierBonus = 0;
  let comfortTierHit = null;
  missingCovered.forEach((lane) => {
    const tier = getComfortTier ? getComfortTier(lane, hero.slug) : comfortTierFor(lane, hero.slug);
    if (!tier) return;
    const bonus = comfortTierWeights[tier] || 0;
    if (bonus > comfortTierBonus) {
      comfortTierBonus = bonus;
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
    cc: heroHasCC(hero.slug, r),
    antiTank: heroIsAntiTank(hero.slug, r),
  }));

  let compositionBonus = 0;
  const compositionReasons = [];

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

  // Ranked-ladder / pro-scene meta (win rate + pick rate only for the
  // bonus - ban rate isn't a pick-relevance signal; `meta` itself was
  // already looked up above to pick the base tier score). A hero with no
  // meta entry yet simply gets no bonus - pick scoring is unchanged from
  // before this existed until real data is populated for it.
  let metaBonus = 0;
  if (meta) {
    metaBonus = meta.winRate * PICK_WIN_RATE_WEIGHT + meta.pickRate * PICK_PICK_RATE_WEIGHT;
  }

  const reasons =
    mode === "rank" && meta
      ? [{ text: `${meta.band}-band (ranked popularity)`, type: "info" }]
      : [{ text: `${hero.tier}-tier`, type: "info" }];
  if (gapBonus > 0) reasons.push({ text: `fills ${missingCovered.join("/")}`, type: "positive" });
  if (meta) {
    reasons.push({
      text: `${meta.raw.winRate}% win rate · ${meta.raw.pickRate}% pick rate${mode === "tournament" ? " (pro)" : ""}`,
      type: "positive",
    });
  }
  if (comfortTierHit) {
    reasons.push({
      text: `${COMFORT_TIER_LABELS[comfortTierHit.tier]} comfort pick (${comfortTierHit.lane})`,
      type: "positive",
    });
  }
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
    score: tierScore + gapBonus + comfortTierBonus + counterBonus + synergyBonus + compositionBonus + metaBonus,
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
// getComfortTier: (lane, slug) => null | "priority" | "reserve" | "common" |
//   "adjust" | "wildcard" - the comfort-tier model, and the only comfort
//   signal factored into scoring (pick phase only). Pass useComfortTier()'s
//   `tierFor` here to use the user's edited assignments; omitted,
//   scorePickCandidate falls back to the shipped default data
//   (lib/comfortHeroes.js). The manual Super Comfort/Comfort system
//   (ComfortProvider) no longer affects scoring - it's visual-only now.
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