// Hero "type" data - Tank / Semi-Tank / Semi-Tank Support / Damage (split
// Long-range vs Short-range), built from the per-lane archetypes in
// TYPES OF HEROES.txt (Heavy, Hybrid, Damage, Assassin, Lockdown, Buff,
// Support, Control (Long), Control (Short), Artillery, Range, Shredd,
// Kits). This is what lets the AI reason about a lineup as a
// *composition* - not just five separate tier scores - so it can tell you
// "you have no frontline", "you have no way to lock down their diver", or
// "this pick doesn't fit any standard balanced comp".
//
// Two things that make this per-ROLE, not just per-archetype:
//  1. A hero's archetype is per-lane - the same hero can play differently
//     in different roles, matching how the tier lists already work.
//  2. The SAME archetype name means a different thing in different lanes.
//     Most notably "Lockdown": in Jungle/Mid it's an aggressive one-shot
//     burst archetype (Damage, Short), but in Roam it's "counter aggressive
//     against assassins with few skills" (Semi-Tank, not Damage at all).
//     So archetype -> category is looked up per (role, archetype), never
//     globally.

import archetypeData from "@/data/hero-archetypes.json";

export const ARCHETYPE_DATA = archetypeData;

// role -> archetype -> { broad, range?, cc?, antiTank?, burst?, utility? }
// broad is one of the four composition buckets from the top of
// TYPES OF HEROES.txt: "Tank" | "SemiTank" | "SemiTankSupport" | "Damage".
// range only applies to "Damage": "Long" | "Short".
// cc: the archetype's write-up calls out crowd control / lockdown as its
//     defining trait.
// antiTank: specifically effective vs. tanks (on-hit / shred damage).
export const ROLE_ARCHETYPE_META = {
  "Clash Lane": {
    Heavy: { broad: "Tank", cc: true },
    Hybrid: { broad: "SemiTank", cc: false },
    Damage: { broad: "Damage", range: "Short", cc: false },
  },
  Jungle: {
    Heavy: { broad: "Tank", cc: true },
    Hybrid: { broad: "SemiTank", cc: false },
    Damage: { broad: "Damage", range: "Long", cc: false },
    Assassin: { broad: "Damage", range: "Short", cc: false, burst: true },
    Lockdown: { broad: "Damage", range: "Short", cc: true, burst: true },
  },
  Roam: {
    Buff: { broad: "SemiTankSupport", cc: false, utility: true },
    Support: { broad: "SemiTankSupport", cc: true, utility: true },
    Damage: { broad: "Damage", range: "Long", cc: false },
    // Roam's Lockdown is its own thing: "counter aggressive against
    // assassins with few skills" - a semi-tank, not a damage archetype.
    Lockdown: { broad: "SemiTank", cc: true },
    Heavy: { broad: "Tank", cc: true },
  },
  Mid: {
    Artillery: { broad: "Damage", range: "Long", cc: false },
    Assassin: { broad: "Damage", range: "Short", cc: false, burst: true },
    "Control (Long)": { broad: "Damage", range: "Long", cc: true },
    "Control (Short)": { broad: "Damage", range: "Short", cc: true },
    Lockdown: { broad: "Damage", range: "Short", cc: true, burst: true },
  },
  Farm: {
    Range: { broad: "Damage", range: "Long", cc: false },
    Shredd: { broad: "Damage", range: "Short", cc: false, antiTank: true },
    Kits: { broad: "Damage", range: "Short", cc: false },
  },
};

// Composition buckets, in priority order for "what is this hero primarily"
// (used only when counting an already-drafted pick toward the team total -
// tankier categories win ties since they're the rarer, more defining trait).
export const COMPOSITION_BUCKETS = ["Tank", "SemiTank", "SemiTankSupport", "DamageLong", "DamageShort"];
const BUCKET_PRIORITY = ["Tank", "SemiTank", "SemiTankSupport", "Damage"];

function bucketKeyFor(meta) {
  if (!meta) return null;
  if (meta.broad === "Damage") return meta.range === "Long" ? "DamageLong" : "DamageShort";
  return meta.broad;
}

export function humanizeBucket(bucket) {
  return (
    {
      Tank: "Tank",
      SemiTank: "Semi-Tank",
      SemiTankSupport: "Semi-Tank Support",
      DamageLong: "Long-range Damage",
      DamageShort: "Short-range Damage",
    }[bucket] || bucket
  );
}

// The four "typical balance lineup" shapes - each a complete 5-hero
// team's worth of composition buckets.
export const BALANCE_TEMPLATES = [
  { label: "2 Tank / 2 Damage (L+S) / 1 Semi-Tank", Tank: 2, SemiTank: 1, SemiTankSupport: 0, DamageLong: 1, DamageShort: 1 },
  { label: "2 Semi-Tank / 2 Damage (L+S) / 1 Semi-Tank Support", Tank: 0, SemiTank: 2, SemiTankSupport: 1, DamageLong: 1, DamageShort: 1 },
  { label: "3 Damage (2S+1L) / 1 Tank / 1 Semi-Tank", Tank: 1, SemiTank: 1, SemiTankSupport: 0, DamageLong: 1, DamageShort: 2 },
  { label: "3 Damage (2S+1L) / 2 Tank", Tank: 2, SemiTank: 0, SemiTankSupport: 0, DamageLong: 1, DamageShort: 2 },
];

// A template is still reachable if the team hasn't already drafted MORE of
// any bucket than that template calls for.
export function achievableTemplates(teamComp) {
  return BALANCE_TEMPLATES.filter((t) => COMPOSITION_BUCKETS.every((b) => (teamComp[b] || 0) <= t[b]));
}

// Every bucket that at least one still-achievable template needs more of.
export function neededBucketsFor(teamComp, achievable) {
  const needed = new Set();
  achievable.forEach((t) =>
    COMPOSITION_BUCKETS.forEach((b) => {
      if ((teamComp[b] || 0) < t[b]) needed.add(b);
    })
  );
  return needed;
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

// { archetype, role, broad, range?, cc?, antiTank?, burst?, utility? } for
// every archetype a hero holds, scoped to one role (or every role it
// appears in, if role is omitted).
function archetypeInfoList(slug, role) {
  if (role) {
    return archetypesForHeroInRole(slug, role)
      .map((a) => ({ archetype: a, role, ...(ROLE_ARCHETYPE_META[role]?.[a] || {}) }))
      .filter((x) => x.broad);
  }
  const results = [];
  Object.keys(archetypeData).forEach((r) => {
    archetypesForHeroInRole(slug, r).forEach((a) => {
      const meta = ROLE_ARCHETYPE_META[r]?.[a];
      if (meta) results.push({ archetype: a, role: r, ...meta });
    });
  });
  return results;
}

export function broadCategoriesForHero(slug, role) {
  return archetypeInfoList(slug, role).map((x) => x.broad);
}

export function heroHasCC(slug, role) {
  return archetypeInfoList(slug, role).some((x) => x.cc);
}

export function heroIsAntiTank(slug, role) {
  return archetypeInfoList(slug, role).some((x) => x.antiTank);
}

// The single composition bucket an already-drafted pick counts toward.
// A hero can hold more than one archetype in a lane (e.g. Roam Liang is
// both Damage and Lockdown/Semi-Tank) - ties go to the tankier bucket
// since that's the rarer, more defining trait for a completed pick.
export function primaryBucketForHero(slug, role) {
  const infos = archetypeInfoList(slug, role);
  if (infos.length === 0) return null;
  infos.sort((a, b) => BUCKET_PRIORITY.indexOf(a.broad) - BUCKET_PRIORITY.indexOf(b.broad));
  return bucketKeyFor(infos[0]);
}

// Every distinct bucket a hero could occupy across a set of still-open
// lanes it could be drafted into - used to check whether a CANDIDATE could
// fill a gap, as opposed to what a drafted pick counts as (see above).
export function bucketOptionsForHeroInLanes(slug, roles) {
  const opts = [];
  (roles || []).forEach((role) => {
    archetypeInfoList(slug, role).forEach((info) => {
      const bucket = bucketKeyFor(info);
      if (bucket) opts.push({ role, bucket, ...info });
    });
  });
  return opts;
}

// Summarizes a team's drafted-so-far picks (as [{slug, role}]) into counts
// per composition bucket plus a CC count and anti-tank count - the
// composition-balance signals the suggestion engine leans on.
export function compositionSummary(pickEntries) {
  const summary = { Tank: 0, SemiTank: 0, SemiTankSupport: 0, DamageLong: 0, DamageShort: 0, cc: 0, antiTank: 0, total: 0 };
  (pickEntries || []).forEach(({ slug, role }) => {
    summary.total += 1;
    const bucket = primaryBucketForHero(slug, role);
    if (bucket && summary[bucket] !== undefined) summary[bucket] += 1;
    if (heroHasCC(slug, role)) summary.cc += 1;
    if (heroIsAntiTank(slug, role)) summary.antiTank += 1;
  });
  summary.Damage = summary.DamageLong + summary.DamageShort;
  return summary;
}