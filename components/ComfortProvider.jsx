"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ROLES } from "@/lib/heroes";

const ComfortContext = createContext(null);
const LEVELS = ["super", "comfort"];

function emptyAssignments() {
  const obj = {};
  ROLES.forEach((lane) => {
    obj[lane] = { super: new Set(), comfort: new Set() };
  });
  return obj;
}

export function ComfortProvider({ children }) {
  // { [lane]: { super: Set<slug>, comfort: Set<slug> } }
  // A hero's slug can live in ANY lane's set, independent of that hero's
  // own listed roles (off-role comfort picks are allowed by design).
  const [comfortAssignments, setComfortAssignments] = useState(emptyAssignments);
  const [algorithmMode, setAlgorithmMode] = useState("standard"); // "standard" | "comfort"

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

  // Highest comfort level this hero holds across any lane - drives the
  // badge on the draft board's hero grid (which isn't lane-scoped itself).
  // "super" beats "comfort" if the hero has both somewhere.
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
        isComfortHero,
        comfortLanesFor,
        totalAssignments,
        algorithmMode,
        setAlgorithmMode,
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
