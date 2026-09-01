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
// into Tank / Semi-Tank / Semi-Tank Support / Damage(Long) / Damage(Short)).
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
// On top of that, every pick is checked against four "typical balance
// lineup" shapes (see BALANCE_TEMPLATES in lib/heroArchetypes.js):
//   2 Tank / 2 Damage(L+S) / 1 Semi-Tank
//   2 Semi-Tank / 2 Damage(L+S) / 1 Semi-Tank Support
//   3 Damage(2 Short+1 Long) / 1 Tank / 1 Semi-Tank
//   3 Damage(2 Short+1 Long) / 2 Tank
// A template stays "achievable" as long as the team hasn't drafted more of
// any bucket than that template calls for. A candidate gets a bonus if it
// can fill a bucket that an achievable template still needs, and a WARNING
// if there's no way to play it - in any of its still-open lanes - that
// keeps even one of the four templates alive. Once the team's comp has
// already drifted off all four shapes, this layer just goes quiet rather
// than keep complaining about a comp that's already unconventional.
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
//
// Each reason is { text, type }, type is "info" (the tier line - neutral
// context, not a score driver) | "positive" (a bonus) | "warning" (a
// penalty - countered by an enemy pick, piling onto an already
// damage-heavy team, or a pick that can't fit any standard balanced
// comp). The UI uses `type` to flag warnings visually instead of burying
// them in a wall of plain text - a hero can still rank highly overall
// (tier + gaps + synergy can easily outweigh one warning) while still
// carrying a real risk worth flagging.

import { heroBySlug, counterDataFor, communityCounterNote, synergyPartnersFor } from "./heroes";
import {
  compositionSummary,
  bucketOptionsForHeroInLanes,
  achievableTemplates,
  neededBucketsFor,
  humanizeBucket,
} from "./heroArchetypes";

const TIER_SCORE = { S: 100, A: 80, B: 60, C: 40, D: 20 };
const FLEX_BONUS_PER_EXTRA_LANE = 20; // ban phase: rewards multi-lane flexibility
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

const BALANCE_FIT_BONUS = 16; // fills a bucket a still-achievable "typical" 5-hero comp needs
const BALANCE_BREAK_PENALTY = 22; // no way to play this hero keeps ANY of the 4 typical comps alive

const COMFORT_BONUS = {
  standard: { super: 0, comfort: 0 },
  comfort: { super: 90, comfort: 45 },
};

export function scoreBanCandidate(hero) {
  const tierScore = TIER_SCORE[hero.tier] ?? 0;
  const flexBonus = (hero.roles.length - 1) * FLEX_BONUS_PER_EXTRA_LANE;

  const reasons = [{ text: `${hero.tier}-tier`, type: "info" }];
  if (flexBonus > 0) reasons.push({ text: `flexible · ${hero.roles.length} lanes`, type: "positive" });

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

  // Every {role, bucket, broad, range, cc, antiTank} this hero could hold,
  // across every lane it could still be drafted into.
  const bucketOptions = bucketOptionsForHeroInLanes(hero.slug, missingCovered);
  const optionsByLane = {};
  bucketOptions.forEach((o) => (optionsByLane[o.role] ||= []).push(o));

  let compositionBonus = 0;
  const compositionReasons = [];

  if (teamComp.Tank === 0) {
    const tankLane = bucketOptions.find((o) => o.broad === "Tank");
    if (tankLane) {
      compositionBonus += NO_FRONTLINE_BONUS;
      compositionReasons.push({ text: `gives your team a frontline (${tankLane.role})`, type: "positive" });
    }
  }

  if (teamComp.cc === 0) {
    const ccLane = bucketOptions.find((o) => o.cc);
    if (ccLane) {
      compositionBonus += NO_CC_BONUS;
      compositionReasons.push({ text: `brings CC your team is missing (${ccLane.role})`, type: "positive" });
    }
  }

  if (teamComp.Damage >= DAMAGE_OVERSTACK_THRESHOLD) {
    const pureDamageOnly =
      missingCovered.length > 0 &&
      missingCovered.every((r) => {
        const opts = optionsByLane[r] || [];
        return opts.length > 0 && opts.every((o) => o.broad === "Damage" && !o.cc);
      });
    if (pureDamageOnly) {
      compositionBonus -= DAMAGE_OVERSTACK_PENALTY;
      compositionReasons.push({ text: `your team already has ${teamComp.Damage} pure-damage picks`, type: "warning" });
    }
  }

  if (enemyComp.Tank >= ENEMY_HEAVY_THRESHOLD) {
    const antiTankLane = bucketOptions.find((o) => o.antiTank);
    if (antiTankLane) {
      compositionBonus += ANTI_TANK_BONUS;
      compositionReasons.push({ text: `shreds through their ${enemyComp.Tank} tanks (${antiTankLane.role})`, type: "positive" });
    }
  }

  // Balance-template fit: does this pick move the team toward (or away
  // from) one of the four "typical balance lineup" shapes? Only reasoned
  // about while at least one shape is still reachable - once the comp has
  // already drifted off all four, this stays quiet instead of nagging
  // about a comp that's already unconventional by design.
  const achievableBefore = achievableTemplates(teamComp);
  if (achievableBefore.length > 0) {
    const neededBuckets = neededBucketsFor(teamComp, achievableBefore);
    const matchedOption = bucketOptions.find((o) => neededBuckets.has(o.bucket));
    if (matchedOption) {
      compositionBonus += BALANCE_FIT_BONUS;
      compositionReasons.push({
        text: `fits a balanced comp (${humanizeBucket(matchedOption.bucket)} · ${matchedOption.role})`,
        type: "positive",
      });
    }

    const distinctBuckets = [...new Set(bucketOptions.map((o) => o.bucket))];
    const survivesSomeOption = distinctBuckets.some((b) => {
      const simulated = { ...teamComp, [b]: (teamComp[b] || 0) + 1 };
      return achievableTemplates(simulated).length > 0;
    });
    if (distinctBuckets.length > 0 && !survivesSomeOption) {
      compositionBonus -= BALANCE_BREAK_PENALTY;
      compositionReasons.push({ text: "doesn't fit any standard balanced 5-hero comp", type: "warning" });
    }
  }

  const reasons = [{ text: `${hero.tier}-tier`, type: "info" }];
  if (gapBonus > 0) reasons.push({ text: `fills ${missingCovered.join("/")}`, type: "positive" });
  if (comfortBonus > 0) {
    reasons.push({ text: comfortLevel === "super" ? "Super Comfort" : "Comfort pick", type: "positive" });
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