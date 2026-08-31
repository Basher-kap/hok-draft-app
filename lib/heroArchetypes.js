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
// cc: true if the archetype's write-up calls out crowd control / lockdown
//     as its defining trait - used to judge whether a team can lock down
//     an enemy diver/carry.
// antiTank: true if the archetype is specifically effective vs. tanks
//           (on-hit / shred damage) - useful when the enemy is stacking Heavy.
export const ARCHETYPE_META = {
  Heavy: { broad: "Tank", cc: true },
  Hybrid: { broad: "Semi-Tank", cc: false },
  Damage: { broad: "Damage", cc: false },
  Assassin: { broad: "Damage", cc: false, burst: true },
  Lockdown: { broad: "Damage", cc: true, burst: true },
  Buff: { broad: "Utility", cc: false, utility: true },
  Support: { broad: "Utility", cc: true, utility: true },
  Control: { broad: "Utility", cc: true },
  Artillery: { broad: "Damage", cc: false },
  Range: { broad: "Damage", cc: false },
  Shredd: { broad: "Damage", cc: false, antiTank: true },
  Kits: { broad: "Damage", cc: false },
};

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
  return archetypesForHero(slug, role).map((a) => ARCHETYPE_META[a]?.broad).filter(Boolean);
}

export function heroHasCC(slug, role) {
  return archetypesForHero(slug, role).some((a) => ARCHETYPE_META[a]?.cc);
}

export function heroIsAntiTank(slug, role) {
  return archetypesForHero(slug, role).some((a) => ARCHETYPE_META[a]?.antiTank);
}

// Summarizes a team's drafted-so-far picks (as [{slug, role}]) into counts
// per broad category and a CC count - the composition-balance signals the
// suggestion engine leans on.
export function compositionSummary(pickEntries) {
  const summary = { Tank: 0, "Semi-Tank": 0, Damage: 0, Utility: 0, cc: 0, antiTank: 0, total: 0 };
  (pickEntries || []).forEach(({ slug, role }) => {
    summary.total += 1;
    broadCategoriesForHero(slug, role).forEach((cat) => {
      if (summary[cat] !== undefined) summary[cat] += 1;
    });
    if (heroHasCC(slug, role)) summary.cc += 1;
    if (heroIsAntiTank(slug, role)) summary.antiTank += 1;
  });
  return summary;
}