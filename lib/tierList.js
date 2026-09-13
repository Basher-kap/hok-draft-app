// Per-role tier lists - one set per draft mode.
//
// heroes.json ships one flat `tier` per hero (sourced from hokstats.gg's
// overall/ranked-ladder rating). Real HoK tier lists are role-specific
// though - a hero can be meta in one lane and unplayable in another - and
// more importantly, a ranked-ladder rating and pro/tournament-scene
// viability are genuinely different things that can diverge a lot (see
// lib/rankedMeta.js vs lib/tournamentMeta.js for the same split applied
// to ban/win/pick-rate data).
//
// So there are two independent per-role tier lists, not one:
//   - "ranked"     - seeded from a hokstats.gg-style sample. What Rank
//                    Draft's AI suggestions score against.
//   - "tournament" - seeded from the same sample as a starting point, but
//                    meant to be hand-curated by the user toward pro/
//                    tournament-scene viability instead of ranked-ladder
//                    popularity. What Tournament Draft's AI suggestions
//                    score against.
// Whatever the user saves in either one is what lib/recommendation.js
// actually scores against for that mode - not the flat heroes.json file.

import defaultRankedTiers from "@/data/tier-lists-default-ranked.json";
import defaultTournamentTiers from "@/data/tier-lists-default-tournament.json";
import { ROLES, TIER_ORDER } from "./heroes";

export const TIERS = ["S", "A", "B", "C", "D"];
export const TIER_LIST_MODES = ["ranked", "tournament"];

const DEFAULTS_BY_MODE = {
  ranked: defaultRankedTiers,
  tournament: defaultTournamentTiers,
};

// Deep clone so callers never mutate the shared default.
export function cloneDefaultTierLists(mode = "ranked") {
  return JSON.parse(JSON.stringify(DEFAULTS_BY_MODE[mode] || DEFAULTS_BY_MODE.ranked));
}

// One clone per mode, keyed the same way as provider state - the shape
// TierListProvider initializes its state from.
export function cloneAllDefaultTierLists() {
  const out = {};
  TIER_LIST_MODES.forEach((mode) => {
    out[mode] = cloneDefaultTierLists(mode);
  });
  return out;
}

export const DEFAULT_ROLE_TIER_LISTS = defaultRankedTiers;

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
// Operates on a single mode's assignments object - caller picks which one.
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

export function resetRoleToDefault(assignments, role, mode = "ranked") {
  const defaults = DEFAULTS_BY_MODE[mode] || DEFAULTS_BY_MODE.ranked;
  return { ...assignments, [role]: JSON.parse(JSON.stringify(defaults[role])) };
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

// True if the user has changed anything in this role away from that mode's
// sample/default list.
export function roleIsCustomized(assignments, role, mode = "ranked") {
  const defaults = DEFAULTS_BY_MODE[mode] || DEFAULTS_BY_MODE.ranked;
  return JSON.stringify(assignments[role]) !== JSON.stringify(defaults[role]);
}