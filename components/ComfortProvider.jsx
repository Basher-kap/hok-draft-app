"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ROLES } from "@/lib/heroes";

const ComfortContext = createContext(null);
const LEVELS = ["super", "comfort"];
const STORAGE_KEY = "hok-draft-comfort-v1";

function emptyAssignments() {
  const obj = {};
  ROLES.forEach((lane) => {
    obj[lane] = { super: new Set(), comfort: new Set() };
  });
  return obj;
}

// Set objects aren't JSON-serializable - convert to plain arrays for storage.
function serialize(comfortAssignments, algorithmMode) {
  const plain = {};
  ROLES.forEach((lane) => {
    plain[lane] = {
      super: [...comfortAssignments[lane].super],
      comfort: [...comfortAssignments[lane].comfort],
    };
  });
  return JSON.stringify({ v: 1, comfortAssignments: plain, algorithmMode });
}

function deserialize(raw) {
  try {
    const parsed = JSON.parse(raw);
    const assignments = emptyAssignments();
    ROLES.forEach((lane) => {
      const lanePlain = parsed?.comfortAssignments?.[lane];
      if (!lanePlain) return;
      assignments[lane].super = new Set(lanePlain.super || []);
      assignments[lane].comfort = new Set(lanePlain.comfort || []);
    });
    const algorithmMode = parsed?.algorithmMode === "comfort" ? "comfort" : "standard";
    return { assignments, algorithmMode };
  } catch {
    return null; // corrupt or missing data - caller falls back to defaults
  }
}

export function ComfortProvider({ children }) {
  const [comfortAssignments, setComfortAssignments] = useState(emptyAssignments);
  const [algorithmMode, setAlgorithmMode] = useState("standard");
  const [hydrated, setHydrated] = useState(false); // avoids overwriting storage before we've loaded it
  const skipNextSave = useRef(true);

  // Load once on mount (client-only - localStorage doesn't exist during SSR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = deserialize(raw);
      if (result) {
        setComfortAssignments(result.assignments);
        setAlgorithmMode(result.algorithmMode);
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
    window.localStorage.setItem(STORAGE_KEY, serialize(comfortAssignments, algorithmMode));
  }, [comfortAssignments, algorithmMode, hydrated]);

  const assignComfort = useCallback((lane, level, slug) => {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: { super: new Set(prev[lane].super), comfort: new Set(prev[lane].comfort) } };
      // A hero can only be in one level per lane - move it, don't duplicate.
      next[lane].super.delete(slug);
      next[lane].comfort.delete(slug);
      next[lane][level].add(slug);
      return next;
    });
  }, []);

  const removeComfort = useCallback((lane, level, slug) => {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: { super: new Set(prev[lane].super), comfort: new Set(prev[lane].comfort) } };
      next[lane][level].delete(slug);
      return next;
    });
  }, []);

  const clearAllComfort = useCallback(() => {
    setComfortAssignments(emptyAssignments());
  }, []);

  // Highest comfort level this hero holds across any lane - drives the
  // badge on the draft board's hero grid (which isn't lane-scoped itself).
  const isComfortHero = useCallback(
    (slug) => {
      const anySuper = ROLES.some((lane) => comfortAssignments[lane].super.has(slug));
      if (anySuper) return "super";
      const anyComfort = ROLES.some((lane) => comfortAssignments[lane].comfort.has(slug));
      return anyComfort ? "comfort" : null;
    },
    [comfortAssignments]
  );

  const comfortLanesFor = useCallback(
    (slug) =>
      ROLES.flatMap((lane) =>
        LEVELS.filter((level) => comfortAssignments[lane][level].has(slug)).map((level) => ({ lane, level }))
      ),
    [comfortAssignments]
  );

  const totalAssignments = useMemo(
    () => ROLES.reduce((sum, lane) => sum + comfortAssignments[lane].super.size + comfortAssignments[lane].comfort.size, 0),
    [comfortAssignments]
  );

  return (
    <ComfortContext.Provider
      value={{
        comfortAssignments,
        assignComfort,
        removeComfort,
        clearAllComfort,
        isComfortHero,
        comfortLanesFor,
        totalAssignments,
        algorithmMode,
        setAlgorithmMode,
        hydrated,
      }}
    >
      {children}
    </ComfortContext.Provider>
  );
}

export function useComfort() {
  const ctx = useContext(ComfortContext);
  if (!ctx) throw new Error("useComfort must be used within a ComfortProvider");
  return ctx;
}
