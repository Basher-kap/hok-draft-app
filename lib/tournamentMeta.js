// Pro/tournament-scene meta stats (Tournament Draft only) - intended
// source: Liquipedia's Honor of Kings World Cup 2026 statistics page
// (pick/ban/win rate broken down by hero, blue/red side, and team).
// Fetching Liquipedia directly has been blocked by their anti-bot
// protection (429 on every attempt, as of Sep 2026) - see project notes.
// Until that's resolved or the data is pasted in manually, this stays
// empty and Tournament Draft's ban suggestions fall back to tier + lane-
// flexibility only, exactly like before this module existed.
//
// This is deliberately separate from Rank Draft's data (lib/rankedMeta.js,
// sourced from the ranked ladder via HOK Camp) - pro-scene drafting and
// ranked-ladder drafting optimize for different things, and the two
// metas can and do diverge a lot (a hero can be a ranked-ladder menace
// but rarely see pro play, or vice versa).
//
// Populate it in this shape once real numbers are available (all values
// are percentages, 0-100):
//
//   augran: { banRate: 42.5, winRate: 51.2, pickRate: 18.7 },
export const TOURNAMENT_META = {
  // augran: { banRate: 0, winRate: 0, pickRate: 0 },
};

export const TOURNAMENT_META_SOURCE = {
  source: "Liquipedia - Honor of Kings World Cup 2026 Statistics",
  url: null, // exact page URL unconfirmed - Liquipedia has blocked every fetch attempt so far
  note: "Awaiting manual data entry - see comment above.",
};

export function tournamentMetaFor(slug) {
  return TOURNAMENT_META[slug] || null;
}

export function hasTournamentMeta(slug) {
  return Boolean(TOURNAMENT_META[slug]);
}

// ---- Normalization -----------------------------------------------------
// Same rationale as lib/rankedMeta.js: raw ban/win/pick percentages live
// on very different scales, so each stat is rescaled to 0-100 relative to
// the CURRENT dataset's own min/max before being blended into a score.
function computeRanges(meta) {
  const entries = Object.values(meta);
  if (entries.length === 0) {
    // No data yet - every hero normalizes to the neutral midpoint (50)
    // rather than dividing by zero/Infinity.
    const empty = { min: 0, max: 0 };
    return { banRate: empty, winRate: empty, pickRate: empty };
  }
  const range = (pick) => {
    const values = entries.map(pick);
    return { min: Math.min(...values), max: Math.max(...values) };
  };
  return {
    banRate: range((v) => v.banRate),
    winRate: range((v) => v.winRate),
    pickRate: range((v) => v.pickRate),
  };
}

const TOURNAMENT_META_RANGES = computeRanges(TOURNAMENT_META);

function normalize(value, { min, max }) {
  if (max === min) return 50; // no spread in the data - stay neutral rather than divide by zero
  return ((value - min) / (max - min)) * 100;
}

// Same shape as tournamentMetaFor(), but each field is rescaled to 0-100
// based on where this hero falls within the full roster's range for that
// stat. `raw` keeps the original percentages around for display purposes.
export function normalizedTournamentMetaFor(slug) {
  const meta = tournamentMetaFor(slug);
  if (!meta) return null;
  return {
    banRate: normalize(meta.banRate, TOURNAMENT_META_RANGES.banRate),
    winRate: normalize(meta.winRate, TOURNAMENT_META_RANGES.winRate),
    pickRate: normalize(meta.pickRate, TOURNAMENT_META_RANGES.pickRate),
    raw: meta,
  };
}