// Per-role tier lists.
//
// heroes.json ships one flat `tier` per hero (sourced from hokstats.gg).
// Real HoK tier lists are role-specific though - a hero can be meta in one
// lane and unplayable in another (e.g. Ata is C clash-lane on hokstats.gg's
// flat rating, but the community splits Clash Lane vs Jungle separately).
// This module holds that role-by-role breakdown, seeded with a
// community/hokstats.gg-style sample, and lets a user fully override it.
// Whatever a user saves here is what the AI suggestion engine (see
// lib/recommendation.js) actually scores against - not the flat file.

import defaultRoleTiers from "@/data/tier-lists-default.json";
import { ROLES, TIER_ORDER } from "./heroes";

export const TIERS = ["S", "A", "B", "C", "D"];

// Deep clone so callers never mutate the shared default.
export function cloneDefaultTierLists() {
  return JSON.parse(JSON.stringify(defaultRoleTiers));
}

export const DEFAULT_ROLE_TIER_LISTS = defaultRoleTiers;

// Every hero currently placed anywhere in a role's tier buckets.
export function assignedSlugsForRole(assignments, role) {
  const set = new Set();
  const roleData = assignments[role] || {};
  TIERS.forEach((t) => (roleData[t] || []).forEach((slug) => set.add(slug)));
  return set;
}

// Heroes that can play this lane (per heroes.json) but haven't been sorted
// into a tier yet in the current (possibly user-edited) list.
export function unrankedHeroesForRole(assignments, role, allHeroes) {
  const assigned = assignedSlugsForRole(assignments, role);
  return allHeroes.filter((h) => h.roles.includes(role) && !assigned.has(h.slug));
}

// Moves a hero to `toTier` within one role's list ("unranked" = remove from
// all tiers, place nowhere). A hero only ever occupies one tier per role.
export function moveHeroInRole(assignments, role, slug, toTier) {
  const next = { ...assignments, [role]: { ...(assignments[role] || {}) } };
  TIERS.forEach((t) => {
    next[role][t] = (assignments[role]?.[t] || []).filter((s) => s !== slug);
  });
  if (TIERS.includes(toTier)) {
    next[role][toTier] = [...(next[role][toTier] || []), slug];
  }
  return next;
}

export function resetRoleToDefault(assignments, role) {
  return { ...assignments, [role]: JSON.parse(JSON.stringify(defaultRoleTiers[role])) };
}

// The tier a hero currently holds in one specific role's list, or null if
// that hero hasn't been placed in that role's tiers at all.
export function tierForHeroInRole(assignments, role, slug) {
  const roleData = assignments[role];
  if (!roleData) return null;
  for (const t of TIERS) {
    if ((roleData[t] || []).includes(slug)) return t;
  }
  return null;
}

// A hero's single "effective" tier across every role it's been sorted
// into - the best (most OP) tier wins. This is what drives the tier badge
// everywhere in the app outside the tier-list editor itself, and what the
// AI suggestion engine scores against. Falls back to heroes.json's flat
// tier for any hero the user hasn't placed in any role list yet.
export function effectiveTierForHero(slug, assignments, fallbackTier) {
  let best = null;
  ROLES.forEach((role) => {
    const t = tierForHeroInRole(assignments, role, slug);
    if (t && (best === null || TIER_ORDER[t] < TIER_ORDER[best])) best = t;
  });
  return best ?? fallbackTier ?? "C";
}

// Returns a new heroes array with `.tier` overridden per the current
// (default or user-customized) role tier lists. Everything downstream -
// HeroGrid, TierBadge, the AI suggestion engine - just reads hero.tier as
// before, so this is the single seam that makes custom tier lists "count".
export function buildEffectiveHeroes(allHeroes, assignments) {
  return allHeroes.map((h) => ({
    ...h,
    tier: effectiveTierForHero(h.slug, assignments, h.tier),
  }));
}

// True if the user has changed anything in this role away from the sample.
export function roleIsCustomized(assignments, role) {
  return JSON.stringify(assignments[role]) !== JSON.stringify(defaultRoleTiers[role]);
}
