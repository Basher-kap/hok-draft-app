"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ROLES } from "@/lib/heroes";

const ComfortContext = createContext(null);

function emptyAssignments() {
  const obj = {};
  ROLES.forEach((lane) => (obj[lane] = new Set()));
  return obj;
}

export function ComfortProvider({ children }) {
  // { [lane]: Set<slug> } - a hero's slug can live in ANY lane's set,
  // independent of that hero's own listed roles (off-role comfort picks).
  const [comfortAssignments, setComfortAssignments] = useState(emptyAssignments);
  const [algorithmMode, setAlgorithmMode] = useState("standard"); // "standard" | "comfort"

  const assignComfort = useCallback((lane, slug) => {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: new Set(prev[lane]) };
      next[lane].add(slug);
      return next;
    });
  }, []);

  const removeComfort = useCallback((lane, slug) => {
    setComfortAssignments((prev) => {
      const next = { ...prev, [lane]: new Set(prev[lane]) };
      next[lane].delete(slug);
      return next;
    });
  }, []);

  // True if this hero is a comfort pick in ANY lane - drives the X badge
  // on the draft board's hero grid (which isn't lane-scoped itself).
  const isComfortHero = useCallback(
    (slug) => ROLES.some((lane) => comfortAssignments[lane].has(slug)),
    [comfortAssignments]
  );

  // Which lanes is this hero marked comfort in (for tooltips / detail views).
  const comfortLanesFor = useCallback(
    (slug) => ROLES.filter((lane) => comfortAssignments[lane].has(slug)),
    [comfortAssignments]
  );

  const totalAssignments = useMemo(
    () => ROLES.reduce((sum, lane) => sum + comfortAssignments[lane].size, 0),
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