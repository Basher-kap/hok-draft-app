// Hero "type" data - Tank / Damage / Semi-tank / Semi-tank-support, broken
// into the finer per-lane archetypes from TYPES OF HEROES.txt (Heavy,
// Hybrid, Assassin, Lockdown, Buff, Support, Control, Artillery, Range,
// Shredd, Kits). This is what lets the AI reason about a lineup as a
// *composition* - not just five separate tier scores - so it can tell you
// "you have no frontline" or "you have no way to lock down their diver".
//
// A hero's archetype is per-lane (the same hero can play differently in
// different roles), matching how the tier lists already work.

import archetypeData from "@/data/hero-archetypes.json";

export const ARCHETYPE_DATA = archetypeData;

// Broad composition bucket + gameplay flags for each fine-grained archetype.
// broad: "Tank" | "Semi-Tank" | "Damage" | "Utility" - used to judge overall
//        team shape (enough frontline? too much pure damage?).
// range: "long" | "short" | null - damage range, used to balance the
//        "2 Damage (Long and Short)" requirement of a balanced lineup.
//        Tanks/Utility don't carry a range.
// cc: true if the archetype's write-up calls out crowd control / lockdown
//     as its defining trait - used to judge whether a team can lock down
//     an enemy diver/carry.
// antiTank: true if the archetype is specifically effective vs. tanks
//           (on-hit / shred damage) - useful when the enemy is stacking Heavy.
// NOTE: Lockdown's broad bucket is role-dependent. In Jungle/Mid it's a
// burst-damage archetype (Damage). In Roam the source doc classifies it as
// a Semi-Tank ("counter aggressive against assassin with few skill") - it
// tanks and peels rather than dealing one-shot damage. `broadByRole` below
// resolves the correct bucket per (archetype, role).
export const ARCHETYPE_META = {
  Heavy: { broad: "Tank", cc: true },
  Hybrid: { broad: "Semi-Tank", cc: false },
  Damage: { broad: "Damage", cc: false, range: "short" },
  Assassin: { broad: "Damage", cc: false, burst: true, range: "short" },
  Lockdown: { broad: "Damage", cc: true, burst: true, range: "short" },
  Buff: { broad: "Utility", cc: false, utility: true },
  Support: { broad: "Utility", cc: true, utility: true },
  Control: { broad: "Utility", cc: true },
  Artillery: { broad: "Damage", cc: false, range: "long" },
  Range: { broad: "Damage", cc: false, range: "long" },
  Shredd: { broad: "Damage", cc: false, antiTank: true, range: "short" },
  Kits: { broad: "Damage", cc: false, range: "short" },
};

// Control splits into long-range (Wang Zhaojun, Lorion, Da Qiao, Yixing) and
// short-range (Lady Zhen, Shi, Yuhuan, Zhou Yu) per the source doc. A hero's
// range for Control is resolved from CONTROL_RANGE below; other archetypes
// carry their range directly in ARCHETYPE_META.
const CONTROL_RANGE_LONG = new Set(["wang-zhaojun", "lorion", "da-qiao", "yixing"]);

// Lockdown is a Semi-Tank in Roam (tanks and peels for the carry) but a
// burst-Damage archetype everywhere else it appears (Jungle, Mid).
const LOCKDOWN_SEMI_TANK_ROLES = new Set(["Roam"]);

// Resolves the broad composition bucket for an (archetype, role) pair,
// applying the role-dependent overrides above.
export function broadForArchetype(archetype, role) {
  const meta = ARCHETYPE_META[archetype];
  if (!meta) return null;
  if (archetype === "Lockdown" && LOCKDOWN_SEMI_TANK_ROLES.has(role)) return "Semi-Tank";
  return meta.broad;
}

// Resolves the damage range ("long" | "short" | null) for an (archetype,
// role, slug) pair. Control is range-split by hero; everything else reads
// straight off ARCHETYPE_META.
export function rangeForArchetype(archetype, role, slug) {
  const meta = ARCHETYPE_META[archetype];
  if (!meta) return null;
  if (archetype === "Control") return CONTROL_RANGE_LONG.has(slug) ? "long" : "short";
  return meta.range ?? null;
}

// All archetypes a hero holds for one specific lane (usually 0 or 1, a
// couple of heroes double up, e.g. Roam's Liang is both Damage & Lockdown).
export function archetypesForHeroInRole(slug, role) {
  const roleData = archetypeData[role];
  if (!roleData) return [];
  return Object.entries(roleData)
    .filter(([, slugs]) => slugs.includes(slug))
    .map(([archetype]) => archetype);
}

// A hero's archetypes for the role they were actually drafted into. Falls
// back to checking every role if `role` is unknown (e.g. ban phase, where
// a hero hasn't been assigned a lane yet) - useful for a rough "is this
// hero generally tanky/CC/etc." read.
export function archetypesForHero(slug, role) {
  if (role) return archetypesForHeroInRole(slug, role);
  const all = new Set();
  Object.keys(archetypeData).forEach((r) =>
    archetypesForHeroInRole(slug, r).forEach((a) => all.add(a))
  );
  return [...all];
}

export function broadCategoriesForHero(slug, role) {
  return archetypesForHero(slug, role).map((a) => broadForArchetype(a, role)).filter(Boolean);
}

export function heroHasCC(slug, role) {
  return archetypesForHero(slug, role).some((a) => ARCHETYPE_META[a]?.cc);
}

export function heroIsAntiTank(slug, role) {
  return archetypesForHero(slug, role).some((a) => ARCHETYPE_META[a]?.antiTank);
}

// The damage range ("long" | "short" | null) a hero brings in a given role,
// across all archetypes it holds there. A hero with both a long-range and a
// short-range archetype in the same role returns "long+short".
export function heroDamageRanges(slug, role) {
  const ranges = new Set();
  archetypesForHeroInRole(slug, role).forEach((a) => {
    const r = rangeForArchetype(a, role, slug);
    if (r) ranges.add(r);
  });
  return [...ranges];
}

// A single hero's primary contribution to the composition, for counting
// toward a balanced lineup. A hero can hold multiple archetypes in one role
// (e.g. Mid Liang is Damage + Lockdown), so we pick the *most tanky/utility*
// bucket first - that's the scarcest resource in a balanced lineup and the
// one we don't want to double-count as "just damage". Returns one of:
// "Tank" | "Semi-Tank" | "Utility" | "Damage" | null.
const BUCKET_PRIORITY = ["Tank", "Utility", "Semi-Tank", "Damage"];
export function primaryContribution(slug, role) {
  const cats = broadCategoriesForHero(slug, role);
  for (const bucket of BUCKET_PRIORITY) {
    if (cats.includes(bucket)) return bucket;
  }
  return null;
}

// Summarizes a team's drafted-so-far picks (as [{slug, role}]) into counts
// per broad category, damage-range tallies, and a CC count - the
// composition-balance signals the suggestion engine leans on. Each pick
// counts once toward its primary contribution so the totals reflect how a
// real lineup reads (5 picks = 5 contributions), not a hero's full
// archetype sprawl.
export function compositionSummary(pickEntries) {
  const summary = {
    Tank: 0,
    "Semi-Tank": 0,
    Damage: 0,
    Utility: 0,
    longDamage: 0,
    shortDamage: 0,
    cc: 0,
    antiTank: 0,
    total: 0,
  };
  (pickEntries || []).forEach(({ slug, role }) => {
    summary.total += 1;
    const primary = primaryContribution(slug, role);
    if (primary && summary[primary] !== undefined) summary[primary] += 1;
    heroDamageRanges(slug, role).forEach((r) => {
      if (r === "long") summary.longDamage += 1;
      else if (r === "short") summary.shortDamage += 1;
    });
    if (heroHasCC(slug, role)) summary.cc += 1;
    if (heroIsAntiTank(slug, role)) summary.antiTank += 1;
  });
  return summary;
}