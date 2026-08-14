import heroesData from "@/data/heroes.json";
import hokstatsCounters from "@/data/counters.json";
import communityCounters from "@/data/community_counters.json";
import communityCounterNotes from "@/data/community_counter_notes.json";
import synergiesData from "@/data/synergies.json";
import tournamentStatsData from "@/data/tournament-stats.json";

// The complete Honor of Kings hero roster, international server.
// Each hero: { slug, name, tier, roles, intl_exclusive, image, url }
export const HEROES = heroesData;

// Two counter data sources, merged: HoKStats' Counters Explorer (94/116
// heroes, site-tracked matchups) and a community-curated set (91/116
// heroes, includes off-role counters the site data doesn't cover).
function mergeCounterSources(...sources) {
  const merged = {};
  for (const source of sources) {
    for (const [slug, data] of Object.entries(source)) {
      if (!merged[slug]) merged[slug] = { strongAgainst: new Set(), counteredBy: new Set() };
      (data.strongAgainst || []).forEach((s) => merged[slug].strongAgainst.add(s));
      (data.counteredBy || []).forEach((s) => merged[slug].counteredBy.add(s));
    }
  }
  const out = {};
  for (const [slug, sets] of Object.entries(merged)) {
    out[slug] = { strongAgainst: [...sets.strongAgainst], counteredBy: [...sets.counteredBy] };
  }
  return out;
}

export const COUNTERS = mergeCounterSources(hokstatsCounters, communityCounters);

export function counterDataFor(slug) {
  return COUNTERS[slug] || { strongAgainst: [], counteredBy: [] };
}

// Community-sourced free-text note for a specific counter pair, if any
// (e.g. "true damage", "denies rotation"). Direction-sensitive: a is the
// one doing the countering.
const COUNTER_NOTE_MAP = new Map(
  communityCounterNotes.map(({ a, b, note }) => [`${a}|${b}`, note])
);
export function communityCounterNote(aSlug, bSlug) {
  return COUNTER_NOTE_MAP.get(`${aSlug}|${bSlug}`) || null;
}

// Community-curated synergy combos: [{ heroes: [slug...], note }].
// A combo can be 2-5 heroes; every pairing within it counts as synergy.
export const SYNERGIES = synergiesData;

const SYNERGY_PARTNERS = {};
for (const combo of SYNERGIES) {
  for (const slug of combo.heroes) {
    if (!SYNERGY_PARTNERS[slug]) SYNERGY_PARTNERS[slug] = new Set();
    combo.heroes.forEach((other) => {
      if (other !== slug) SYNERGY_PARTNERS[slug].add(other);
    });
  }
}

// Slugs of heroes that appear in a synergy combo together with `slug`.
export function synergyPartnersFor(slug) {
  return SYNERGY_PARTNERS[slug] || new Set();
}

// Real tournament pick/ban/win data (currently a Honor of Kings World Cup
// 2026 data source - see data/tournament-stats.json). Raw counts live in
// the JSON; rates are derived here so there's one source of truth. Returns
// null for a hero with no recorded games, or while the file is still an
// empty template (totalGames = 0) - callers should treat that as "no
// tournament signal", not "0% presence".
export const TOURNAMENT_STATS_META = tournamentStatsData.meta || {};

export function tournamentStatsFor(slug) {
  const totalGames = TOURNAMENT_STATS_META.totalGames || 0;
  const entry = tournamentStatsData.heroes?.[slug];
  if (!entry || totalGames === 0) return null;

  const picks = entry.picks || 0;
  const bans = entry.bans || 0;
  const wins = entry.wins || 0;

  return {
    picks,
    bans,
    wins,
    pickRate: picks / totalGames,
    banRate: bans / totalGames,
    presence: (picks + bans) / totalGames, // "contested rate" - how often this hero is touched at all
    winRate: picks > 0 ? wins / picks : null,
  };
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