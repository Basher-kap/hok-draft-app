"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { HEROES, ROLES } from "@/lib/heroes";
import {
  cloneDefaultTierLists,
  moveHeroInRole,
  resetRoleToDefault,
  buildEffectiveHeroes,
  roleIsCustomized,
} from "@/lib/tierList";

const TierListContext = createContext(null);
const STORAGE_KEY = "hok-draft-tierlist-v1";

function serialize(assignments) {
  return JSON.stringify({ v: 1, assignments });
}

function deserialize(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.assignments) return null;
    // Merge onto a fresh default skeleton so a schema change (new hero,
    // new role) never crashes on stale localStorage data.
    const base = cloneDefaultTierLists();
    ROLES.forEach((role) => {
      if (parsed.assignments[role]) base[role] = parsed.assignments[role];
    });
    return base;
  } catch {
    return null;
  }
}

export function TierListProvider({ children }) {
  const [assignments, setAssignments] = useState(cloneDefaultTierLists);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = deserialize(raw);
      if (result) setAssignments(result);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, serialize(assignments));
  }, [assignments, hydrated]);

  const moveHero = useCallback((role, slug, toTier) => {
    setAssignments((prev) => moveHeroInRole(prev, role, slug, toTier));
  }, []);

  const resetRole = useCallback((role) => {
    setAssignments((prev) => resetRoleToDefault(prev, role));
  }, []);

  const resetAll = useCallback(() => {
    setAssignments(cloneDefaultTierLists());
  }, []);

  const isCustomized = useCallback((role) => roleIsCustomized(assignments, role), [assignments]);

  const anyCustomized = useMemo(() => ROLES.some((role) => roleIsCustomized(assignments, role)), [assignments]);

  // The hero roster with `.tier` overridden by the current tier lists -
  // this is what every other screen (draft board, AI suggestions, comfort
  // picks) should read instead of the raw HEROES import.
  const effectiveHeroes = useMemo(() => buildEffectiveHeroes(HEROES, assignments), [assignments]);

  return (
    <TierListContext.Provider
      value={{
        assignments,
        moveHero,
        resetRole,
        resetAll,
        isCustomized,
        anyCustomized,
        effectiveHeroes,
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
