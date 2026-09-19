"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { HEROES, ROLES } from "@/lib/heroes";
import {
  TIER_LIST_MODES,
  cloneDefaultTierLists,
  cloneAllDefaultTierLists,
  moveHeroInRole,
  resetRoleToDefault,
  buildEffectiveHeroes,
  roleIsCustomized,
} from "@/lib/tierList";

const TierListContext = createContext(null);
const STORAGE_KEY = "hok-draft-tierlist-v2"; // v2: split into { ranked, tournament }
const LEGACY_STORAGE_KEY = "hok-draft-tierlist-v1"; // v1: one flat list - treated as "ranked" on migration

function serialize(assignmentsByMode) {
  return JSON.stringify({ v: 2, ...assignmentsByMode });
}

// Merges saved assignments onto a fresh default skeleton for one mode, so a
// schema change (new hero, new role) never crashes on stale localStorage
// data - any role missing from the saved blob just falls back to default.
function mergeOntoDefaults(savedRoleData, mode) {
  const base = cloneDefaultTierLists(mode);
  ROLES.forEach((role) => {
    if (savedRoleData?.[role]) base[role] = savedRoleData[role];
  });
  return base;
}

function deserialize(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    const out = {};
    TIER_LIST_MODES.forEach((mode) => {
      out[mode] = mergeOntoDefaults(parsed[mode], mode);
    });
    return out;
  } catch {
    return null;
  }
}

// Reads the old single-list format (pre-mode-split) and treats it as the
// "ranked" list, since that's what it always was in practice - the flat
// tier-lists-default.json this app shipped with before Tournament Draft
// existed was the hokstats.gg-style ranked sample. Tournament stays on its
// own default until the user customizes it separately.
function migrateLegacy(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.assignments) return null;
    return {
      ranked: mergeOntoDefaults(parsed.assignments, "ranked"),
      tournament: cloneDefaultTierLists("tournament"),
    };
  } catch {
    return null;
  }
}

export function TierListProvider({ children }) {
  const [assignmentsByMode, setAssignmentsByMode] = useState(cloneAllDefaultTierLists);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  // Load once on mount (client-only - localStorage doesn't exist during SSR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = deserialize(raw);
      if (result) setAssignmentsByMode(result);
    } else {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const migrated = migrateLegacy(legacyRaw);
        if (migrated) setAssignmentsByMode(migrated);
      }
    }
    setHydrated(true);
  }, []);

  // Persist on every change, once hydration has happened.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, serialize(assignmentsByMode));
  }, [assignmentsByMode, hydrated]);

  const moveHero = useCallback((mode, role, slug, toTier) => {
    setAssignmentsByMode((prev) => ({ ...prev, [mode]: moveHeroInRole(prev[mode], role, slug, toTier) }));
  }, []);

  const resetRole = useCallback((mode, role) => {
    setAssignmentsByMode((prev) => ({ ...prev, [mode]: resetRoleToDefault(prev[mode], role, mode) }));
  }, []);

  const resetAllForMode = useCallback((mode) => {
    setAssignmentsByMode((prev) => ({ ...prev, [mode]: cloneDefaultTierLists(mode) }));
  }, []);

  const isCustomized = useCallback(
    (mode, role) => roleIsCustomized(assignmentsByMode[mode], role, mode),
    [assignmentsByMode]
  );

  const anyCustomized = useCallback(
    (mode) => ROLES.some((role) => roleIsCustomized(assignmentsByMode[mode], role, mode)),
    [assignmentsByMode]
  );

  // The hero roster with `.tier` overridden by the current tier list, one
  // build per mode - this is what every other screen (draft board, AI
  // suggestions, comfort picks) should read instead of the raw HEROES
  // import. Rank Draft always reads "ranked", Tournament Draft always
  // reads "tournament", regardless of which tab is open on /tier-list.
  const effectiveHeroesByMode = useMemo(() => {
    const out = {};
    TIER_LIST_MODES.forEach((mode) => {
      out[mode] = buildEffectiveHeroes(HEROES, assignmentsByMode[mode]);
    });
    return out;
  }, [assignmentsByMode]);

  const effectiveHeroesFor = useCallback((mode) => effectiveHeroesByMode[mode], [effectiveHeroesByMode]);

  return (
    <TierListContext.Provider
      value={{
        assignmentsByMode,
        moveHero,
        resetRole,
        resetAllForMode,
        isCustomized,
        anyCustomized,
        effectiveHeroesFor,
        hydrated,
      }}
    >
      {children}
    </TierListContext.Provider>
  );
}

export function useTierList() {
  const ctx = useContext(TierListContext);
  if (!ctx) throw new Error("useTierList must be used within a TierListProvider");
  return ctx;
}