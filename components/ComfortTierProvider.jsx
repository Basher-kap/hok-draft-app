"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ROLES } from "@/lib/heroes";
import { COMFORT_TIER_ORDER } from "@/lib/comfortHeroes";
import defaultComfortHeroes from "@/data/comfort-heroes.json";

const ComfortTierContext = createContext(null);
const STORAGE_KEY = "hok-draft-comfort-tiers-v1";

function defaultAssignments() {
  const obj = {};
  ROLES.forEach((lane) => {
    obj[lane] = {};
    COMFORT_TIER_ORDER.forEach((tier) => {
      obj[lane][tier] = new Set(defaultComfortHeroes[lane]?.[tier] || []);
    });
  });
  return obj;
}

// Set objects aren't JSON-serializable - convert to plain arrays for storage.
function serialize(assignments) {
  const plain = {};
  ROLES.forEach((lane) => {
    plain[lane] = {};
    COMFORT_TIER_ORDER.forEach((tier) => {
      plain[lane][tier] = [...assignments[lane][tier]];
    });
  });
  return JSON.stringify({ v: 1, assignments: plain });
}

function deserialize(raw) {
  try {
    const parsed = JSON.parse(raw);
    const assignments = defaultAssignments();
    ROLES.forEach((lane) => {
      const lanePlain = parsed?.assignments?.[lane];
      if (!lanePlain) return;
      COMFORT_TIER_ORDER.forEach((tier) => {
        assignments[lane][tier] = new Set(lanePlain[tier] || []);
      });
    });
    return assignments;
  } catch {
    return null; // corrupt or missing data - caller falls back to defaults
  }
}

// Same shape/behavior pattern as ComfortProvider, but for the five-level
// Priority/Reserve/Common/Adjust/Wildcard model (lib/comfortHeroes.js)
// instead of the two-level Super/Comfort one. Starts seeded from
// data/comfort-heroes.json (Basher's default read) and becomes editable
// from the Comfort Heroes page - once edited, the edited version is what
// persists (localStorage), with a reset back to the shipped defaults
// available any time.
export function ComfortTierProvider({ children }) {
  const [assignments, setAssignments] = useState(defaultAssignments);
  const [hydrated, setHydrated] = useState(false); // avoids overwriting storage before we've loaded it
  const skipNextSave = useRef(true);

  // Load once on mount (client-only - localStorage doesn't exist during SSR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = deserialize(raw);
      if (result) setAssignments(result);
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
    window.localStorage.setItem(STORAGE_KEY, serialize(assignments));
  }, [assignments, hydrated]);

  const assignTier = useCallback((lane, tier, slug) => {
    setAssignments((prev) => {
      const nextLane = {};
      COMFORT_TIER_ORDER.forEach((t) => {
        nextLane[t] = new Set(prev[lane][t]);
      });
      // A hero can only sit at one tier per lane - move it, don't duplicate.
      COMFORT_TIER_ORDER.forEach((t) => nextLane[t].delete(slug));
      nextLane[tier].add(slug);
      return { ...prev, [lane]: nextLane };
    });
  }, []);

  const removeTier = useCallback((lane, tier, slug) => {
    setAssignments((prev) => {
      const nextLane = { ...prev[lane], [tier]: new Set(prev[lane][tier]) };
      nextLane[tier].delete(slug);
      return { ...prev, [lane]: nextLane };
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setAssignments(defaultAssignments());
  }, []);

  // lane -> slug -> tier | null. Used by the recommendation engine.
  const tierFor = useCallback(
    (lane, slug) => {
      const laneAssignments = assignments[lane];
      if (!laneAssignments) return null;
      for (const tier of COMFORT_TIER_ORDER) {
        if (laneAssignments[tier].has(slug)) return tier;
      }
      return null;
    },
    [assignments]
  );

  const tiersForHero = useCallback(
    (slug) =>
      ROLES.flatMap((lane) =>
        COMFORT_TIER_ORDER.filter((tier) => assignments[lane][tier].has(slug)).map((tier) => ({ lane, tier }))
      ),
    [assignments]
  );

  const totalAssignments = useMemo(
    () =>
      ROLES.reduce(
        (sum, lane) => sum + COMFORT_TIER_ORDER.reduce((laneSum, tier) => laneSum + assignments[lane][tier].size, 0),
        0
      ),
    [assignments]
  );

  return (
    <ComfortTierContext.Provider
      value={{
        assignments,
        assignTier,
        removeTier,
        resetToDefault,
        tierFor,
        tiersForHero,
        totalAssignments,
        hydrated,
      }}
    >
      {children}
    </ComfortTierContext.Provider>
  );
}

export function useComfortTier() {
  const ctx = useContext(ComfortTierContext);
  if (!ctx) throw new Error("useComfortTier must be used within a ComfortTierProvider");
  return ctx;
}