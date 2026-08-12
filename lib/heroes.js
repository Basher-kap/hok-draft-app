import heroesData from "@/data/heroes.json";
import countersData from "@/data/counters.json";

// The complete Honor of Kings hero roster, international server.
// Each hero: { slug, name, tier, roles, intl_exclusive, image, url }
export const HEROES = heroesData;

// Matchup data keyed by slug: { strongAgainst: [slug], counteredBy: [slug] }
// Sourced from HoKStats' Counters Explorer. Covers 94 of 116 heroes -
// heroes without evidence are simply absent, not guessed at.
export const COUNTERS = countersData;

export function counterDataFor(slug) {
  return COUNTERS[slug] || { strongAgainst: [], counteredBy: [] };
}

export const ROLES = ["Clash Lane", "Jungle", "Mid", "Farm", "Roam"];

export const ROLE_COLOR = {
  "Clash Lane": "#c0392b",
  Jungle: "#2e8b3d",
  Mid: "#7c4dff",
  Farm: "#d4a017",
  Roam: "#1f8a9c",
};

export const TIER_STYLE = {
  S: { color: "#f5c451", glow: "rgba(245,196,81,0.35)", chevrons: 3 },
  A: { color: "#e0703a", glow: "rgba(224,112,58,0.30)", chevrons: 2 },
  B: { color: "#5aa9e6", glow: "rgba(90,169,230,0.28)", chevrons: 1 },
  C: { color: "#8a94a6", glow: "rgba(138,148,166,0.22)", chevrons: 0 },
};

export const TIER_ORDER = { S: 0, A: 1, B: 2, C: 3, D: 4 };

export function heroBySlug(slug) {
  return HEROES.find((h) => h.slug === slug) || null;
}

export function sortByTier(list) {
  return [...list].sort((a, b) => {
    const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    return t !== 0 ? t : a.name.localeCompare(b.name);
  });
}