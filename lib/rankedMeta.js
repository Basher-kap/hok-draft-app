// Ranked-ladder meta stats (Rank Draft only) - intended source: HOK
// Camp's official hero hot list, via HoKStats.gg's server-rendered
// mirror (the raw HOK Camp page is a JS SPA and can't be fetched
// directly): https://hokstats.gg/official-popularity/
// This is deliberately separate from Tournament Draft's data
// (lib/tournamentMeta.js, pro/tournament-scene stats e.g. KWC 2026) -
// the two modes intentionally see different "what's worth banning/
// picking" data, since the ranked ladder meta and the pro meta often
// diverge a lot.
//
// Cleared on request - RANKED_META is empty again. Populate it in this
// shape once you're ready (all values are percentages, 0-100):
//
//   ata: { banRate: 42.5, winRate: 51.2, pickRate: 18.7 },
//
// A hero with no entry here isn't penalized or guessed at - both the
// ban and pick scorers just fall back to tier + lane-flexibility for it,
// same as every hero did before this module existed.
export const RANKED_META_SOURCE = {
  source: "HOK Camp (via HoKStats.gg official-popularity mirror)",
  url: "https://hokstats.gg/official-popularity/",
  sourceDate: null,
  capturedAt: null,
};

export const RANKED_META = {
  // ata: { banRate: 0, winRate: 0, pickRate: 0 },
};

export function rankedMetaFor(slug) {
  return RANKED_META[slug] || null;
}

export function hasRankedMeta(slug) {
  return Boolean(RANKED_META[slug]);
}

// ---- Normalization -----------------------------------------------------
// Raw ban/win/pick rates live on wildly different scales - ban rate spans
// roughly 0-4%, win rate clusters tightly around 45-55%, pick rate spans
// roughly 0-3%. Blending them as raw percentages lets win rate (a nearly
// constant ~50 for everyone) swamp ban rate (the most meaningful "should
// I ban this" signal, but with the smallest numeric range). Normalizing
// each metric to 0-100 relative to the CURRENT dataset's own min/max
// fixes that: every metric gets an equal-sized runway to influence the
// score, regardless of how compressed or spread out its raw percentages
// happen to be.
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

const RANKED_META_RANGES = computeRanges(RANKED_META);

function normalize(value, { min, max }) {
  if (max === min) return 50; // no spread in the data - stay neutral rather than divide by zero
  return ((value - min) / (max - min)) * 100;
}

// Same shape as rankedMetaFor(), but each field is rescaled to 0-100
// based on where this hero falls within the full roster's range for that
// stat (0 = lowest in the dataset, 100 = highest). `raw` keeps the
// original percentages around for display purposes.
export function normalizedRankedMetaFor(slug) {
  const meta = rankedMetaFor(slug);
  if (!meta) return null;
  return {
    banRate: normalize(meta.banRate, RANKED_META_RANGES.banRate),
    winRate: normalize(meta.winRate, RANKED_META_RANGES.winRate),
    pickRate: normalize(meta.pickRate, RANKED_META_RANGES.pickRate),
    raw: meta,
  };
}