// Ranked-ladder meta stats (Rank Draft only) - sourced from HOK Camp's
// official hero hot list, via HoKStats.gg's server-rendered mirror (the
// raw HOK Camp page is a JS SPA and can't be fetched directly):
// https://hokstats.gg/official-popularity/
// This is deliberately separate from Tournament Draft's data
// (lib/tournamentMeta.js, pro/tournament-scene stats e.g. KWC 2026) -
// the two modes intentionally see different "what's worth banning/
// picking" data, since the ranked ladder meta and the pro meta often
// diverge a lot.
//
// `band` is this page's own S/A/B/C "official popularity" grouping,
// computed per-lane from the same ranked win/pick/ban data below - NOT
// the same thing as a hero's generic `tier` field in data/heroes.json
// (that comes from HoKStats' separate general "Strength tier list" page,
// hokstats.gg/tier-list/, an editorial/community strength judgment with
// its own S-D scale). Rank Draft uses `band` as its base score instead
// of the generic tier - see RANKED_TIER_SCORE and scoreRankedBanCandidate
// / scorePickCandidate in lib/recommendation.js. Tournament Draft keeps
// using the generic tier until it has its own tournament-specific bands
// to substitute the same way.
//
// Source date: Sep 4, 2026 · Captured: Sep 5, 2026 · Scope: International
// region 608, Ranked scope 1, Segment 255, 116/116 heroes.
// Rates are percentages (0-100). Re-fetch and paste over this file
// periodically to keep it current - just ask, and provide the page again
// if it's stale.
export const RANKED_META_SOURCE = {
  source: "HOK Camp (via HoKStats.gg official-popularity mirror)",
  url: "https://hokstats.gg/official-popularity/",
  sourceDate: "2026-09-04",
  capturedAt: "2026-09-05",
};

export const RANKED_META = {
  // -- Clash Lane (30) - S1 A6 B8 C15 --
  "li-xin": { band: "S", banRate: 3, winRate: 51.4, pickRate: 2.2 },
  dun: { band: "A", banRate: 0.6, winRate: 52.8, pickRate: 1.7 },
  chicha: { band: "A", banRate: 0.4, winRate: 52.2, pickRate: 1.5 },
  kaizer: { band: "A", banRate: 0.1, winRate: 50.7, pickRate: 1.4 },
  devara: { band: "A", banRate: 0.3, winRate: 48.8, pickRate: 1.2 },
  "mi-yue": { band: "A", banRate: 1.1, winRate: 50, pickRate: 0.8 },
  florentino: { band: "A", banRate: 1.7, winRate: 51.8, pickRate: 0.5 },
  "lian-po": { band: "B", banRate: 0.2, winRate: 52.6, pickRate: 1.2 },
  "lu-bu": { band: "B", banRate: 0.3, winRate: 48.9, pickRate: 1.1 },
  arthur: { band: "B", banRate: 0, winRate: 49.9, pickRate: 1.1 },
  umbrosa: { band: "B", banRate: 0.1, winRate: 50.6, pickRate: 1 },
  "sun-ce": { band: "B", banRate: 0, winRate: 48.4, pickRate: 0.9 },
  "xiang-yu": { band: "B", banRate: 0, winRate: 50.8, pickRate: 0.7 },
  biron: { band: "B", banRate: 0.2, winRate: 47.8, pickRate: 0.7 },
  charlotte: { band: "B", banRate: 0.1, winRate: 49.6, pickRate: 0.7 },
  "flowborn-tank": { band: "C", banRate: 0.1, winRate: 48.8, pickRate: 0.6 },
  ata: { band: "C", banRate: 0, winRate: 52.8, pickRate: 0.5 },
  allain: { band: "C", banRate: 0, winRate: 50.4, pickRate: 0.5 },
  "guan-yu": { band: "C", banRate: 0.1, winRate: 47.5, pickRate: 0.4 },
  nezha: { band: "C", banRate: 0, winRate: 52.7, pickRate: 0.4 },
  fatih: { band: "C", banRate: 0.1, winRate: 52.8, pickRate: 0.4 },
  wuyan: { band: "C", banRate: 0, winRate: 51.9, pickRate: 0.4 },
  fuzi: { band: "C", banRate: 0, winRate: 52.7, pickRate: 0.4 },
  "bai-qi": { band: "C", banRate: 0, winRate: 51.2, pickRate: 0.4 },
  mayene: { band: "C", banRate: 0, winRate: 47.4, pickRate: 0.4 },
  mulan: { band: "C", banRate: 0, winRate: 49.8, pickRate: 0.3 },
  "yang-jian": { band: "C", banRate: 0, winRate: 50.8, pickRate: 0.3 },
  yango: { band: "C", banRate: 0, winRate: 49.2, pickRate: 0.3 },
  "liu-bang": { band: "C", banRate: 0, winRate: 51.2, pickRate: 0.3 },
  dharma: { band: "C", banRate: 0, winRate: 52.8, pickRate: 0.3 },

  // -- Mid (26) - S5 A5 B5 C11 --
  angela: { band: "S", banRate: 1.4, winRate: 51.1, pickRate: 2.8 },
  daji: { band: "S", banRate: 2.3, winRate: 51.3, pickRate: 2.8 },
  milady: { band: "S", banRate: 1.8, winRate: 47.8, pickRate: 1.7 },
  mozi: { band: "S", banRate: 1.7, winRate: 49.8, pickRate: 1.6 },
  liang: { band: "S", banRate: 3.7, winRate: 50.7, pickRate: 0.8 },
  kongming: { band: "A", banRate: 0.7, winRate: 51.4, pickRate: 1.9 },
  "wang-zhaojun": { band: "A", banRate: 0.7, winRate: 50.9, pickRate: 1.7 },
  "xiao-qiao": { band: "A", banRate: 0.3, winRate: 48.2, pickRate: 1.6 },
  haya: { band: "A", banRate: 2.4, winRate: 48.2, pickRate: 1.1 },
  nuwa: { band: "A", banRate: 0.6, winRate: 53.8, pickRate: 1 },
  "lady-zhen": { band: "B", banRate: 0, winRate: 50.8, pickRate: 1 },
  shi: { band: "B", banRate: 0.5, winRate: 51.4, pickRate: 0.9 },
  garuda: { band: "B", banRate: 0, winRate: 51, pickRate: 0.8 },
  diaochan: { band: "B", banRate: 0.1, winRate: 47.6, pickRate: 0.7 },
  heino: { band: "B", banRate: 0.1, winRate: 47.7, pickRate: 0.7 },
  yixing: { band: "C", banRate: 0, winRate: 51, pickRate: 0.7 },
  ziya: { band: "C", banRate: 0.1, winRate: 50, pickRate: 0.6 },
  "mai-shiranui": { band: "C", banRate: 0.1, winRate: 49.2, pickRate: 0.6 },
  "dr-bian": { band: "C", banRate: 0.2, winRate: 50.2, pickRate: 0.5 },
  yuhuan: { band: "C", banRate: 0, winRate: 49.5, pickRate: 0.5 },
  lorion: { band: "C", banRate: 0.2, winRate: 51.1, pickRate: 0.4 },
  "flowborn-mage": { band: "C", banRate: 0, winRate: 51.1, pickRate: 0.4 },
  gao: { band: "C", banRate: 0, winRate: 52.1, pickRate: 0.4 },
  "zhou-yu": { band: "C", banRate: 0, winRate: 51.3, pickRate: 0.4 },
  "gan-mo": { band: "C", banRate: 0.1, winRate: 50, pickRate: 0.4 },
  shangguan: { band: "C", banRate: 0, winRate: 48.8, pickRate: 0.4 },

  // -- Farm (18) - S2 A6 B8 C2 --
  "hou-yi": { band: "S", banRate: 0.2, winRate: 49.3, pickRate: 2.7 },
  aoyin: { band: "S", banRate: 3.2, winRate: 49.5, pickRate: 1.6 },
  "luban-no-7": { band: "A", banRate: 0.4, winRate: 51.9, pickRate: 2.1 },
  "marco-polo": { band: "A", banRate: 0.3, winRate: 50, pickRate: 1.9 },
  "lady-sun": { band: "A", banRate: 0.1, winRate: 49, pickRate: 1.8 },
  erin: { band: "A", banRate: 0.2, winRate: 50.8, pickRate: 1.7 },
  "consort-yu": { band: "A", banRate: 0.3, winRate: 51.9, pickRate: 1.7 },
  garo: { band: "A", banRate: 0.4, winRate: 53.8, pickRate: 1.6 },
  "flowborn-marksman": { band: "B", banRate: 0.1, winRate: 52.3, pickRate: 1.2 },
  fang: { band: "B", banRate: 0, winRate: 49, pickRate: 1 },
  shouyue: { band: "B", banRate: 0.1, winRate: 50.5, pickRate: 0.9 },
  luara: { band: "B", banRate: 0.1, winRate: 46.4, pickRate: 0.9 },
  alessio: { band: "B", banRate: 0, winRate: 52.4, pickRate: 0.9 },
  "di-renjie": { band: "B", banRate: 0, winRate: 51.9, pickRate: 0.9 },
  chano: { band: "B", banRate: 0.1, winRate: 51, pickRate: 0.8 },
  arli: { band: "B", banRate: 0.2, winRate: 46.9, pickRate: 0.7 },
  "huang-zhong": { band: "C", banRate: 0, winRate: 50.7, pickRate: 0.4 },
  "meng-ya": { band: "C", banRate: 0, winRate: 52.3, pickRate: 0.4 },

  // -- Jungle (26) - S1 A3 B9 C13 --
  augran: { band: "S", banRate: 4, winRate: 49.6, pickRate: 1.6 },
  wukong: { band: "A", banRate: 0.6, winRate: 49, pickRate: 1.4 },
  lam: { band: "A", banRate: 1.1, winRate: 48.3, pickRate: 1.3 },
  "dian-wei": { band: "A", banRate: 0.6, winRate: 50.7, pickRate: 1 },
  musashi: { band: "B", banRate: 0.3, winRate: 49.5, pickRate: 0.9 },
  zilong: { band: "B", banRate: 0, winRate: 54.4, pickRate: 0.9 },
  ying: { band: "B", banRate: 0.1, winRate: 53.9, pickRate: 0.8 },
  "sima-yi": { band: "B", banRate: 0.3, winRate: 53.5, pickRate: 0.7 },
  yao: { band: "B", banRate: 0.1, winRate: 52, pickRate: 0.7 },
  luna: { band: "B", banRate: 0.4, winRate: 46.2, pickRate: 0.6 },
  arke: { band: "B", banRate: 0.8, winRate: 51.4, pickRate: 0.5 },
  feyd: { band: "B", banRate: 0.3, winRate: 53.9, pickRate: 0.5 },
  "gao-changgong": { band: "B", banRate: 1.1, winRate: 47.9, pickRate: 0.5 },
  butterfly: { band: "C", banRate: 0.1, winRate: 51.7, pickRate: 0.5 },
  agudo: { band: "C", banRate: 0, winRate: 53.7, pickRate: 0.5 },
  "li-bai": { band: "C", banRate: 0.1, winRate: 52.2, pickRate: 0.5 },
  nakoruru: { band: "C", banRate: 0.1, winRate: 49.7, pickRate: 0.5 },
  "ukyo-tachibana": { band: "C", banRate: 0, winRate: 48.9, pickRate: 0.3 },
  jing: { band: "C", banRate: 0.1, winRate: 45.8, pickRate: 0.3 },
  xuance: { band: "C", banRate: 0.1, winRate: 54.2, pickRate: 0.3 },
  "liu-bei": { band: "C", banRate: 0, winRate: 51.3, pickRate: 0.3 },
  pei: { band: "C", banRate: 0.1, winRate: 50.9, pickRate: 0.3 },
  "han-xin": { band: "C", banRate: 0, winRate: 47.6, pickRate: 0.3 },
  menki: { band: "C", banRate: 0, winRate: 53.2, pickRate: 0.2 },
  cirrus: { band: "C", banRate: 0, winRate: 51.7, pickRate: 0.2 },
  athena: { band: "C", banRate: 0, winRate: 54.2, pickRate: 0.1 },

  // -- Roam (16) - S2 A3 B5 C6 --
  dolia: { band: "S", banRate: 1, winRate: 47, pickRate: 2.3 },
  "cai-yan": { band: "S", banRate: 2.2, winRate: 51.2, pickRate: 1.2 },
  yaria: { band: "A", banRate: 1.6, winRate: 49.4, pickRate: 1.1 },
  dyadia: { band: "A", banRate: 1.3, winRate: 48.7, pickRate: 1 },
  donghuang: { band: "A", banRate: 2.5, winRate: 48.3, pickRate: 0.7 },
  kui: { band: "B", banRate: 0.5, winRate: 49.1, pickRate: 0.9 },
  "da-qiao": { band: "B", banRate: 0.5, winRate: 48.5, pickRate: 0.9 },
  "liu-shan": { band: "B", banRate: 0.1, winRate: 48.6, pickRate: 0.9 },
  "zhang-fei": { band: "B", banRate: 0.4, winRate: 49.3, pickRate: 0.8 },
  zhuangzi: { band: "B", banRate: 1.2, winRate: 47.8, pickRate: 0.6 },
  ming: { band: "C", banRate: 0, winRate: 50.3, pickRate: 0.5 },
  sakeer: { band: "C", banRate: 0, winRate: 52.7, pickRate: 0.5 },
  annette: { band: "C", banRate: 0.1, winRate: 49.2, pickRate: 0.4 },
  lapulapu: { band: "C", banRate: 0, winRate: 55.1, pickRate: 0.4 },
  "sun-bin": { band: "C", banRate: 0, winRate: 48.8, pickRate: 0.3 },
  guiguzi: { band: "C", banRate: 0.2, winRate: 51.1, pickRate: 0.2 },
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
// happen to be. `band` is NOT normalized here - it's a categorical S/A/B/C
// label, converted to a score via RANKED_TIER_SCORE in recommendation.js.
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

// Same shape as rankedMetaFor(), but banRate/winRate/pickRate are each
// rescaled to 0-100 based on where this hero falls within the full
// roster's range for that stat (0 = lowest in the dataset, 100 =
// highest). `band` passes through unchanged (categorical, not a rate).
// `raw` keeps the original entry around for display purposes.
export function normalizedRankedMetaFor(slug) {
  const meta = rankedMetaFor(slug);
  if (!meta) return null;
  return {
    band: meta.band,
    banRate: normalize(meta.banRate, RANKED_META_RANGES.banRate),
    winRate: normalize(meta.winRate, RANKED_META_RANGES.winRate),
    pickRate: normalize(meta.pickRate, RANKED_META_RANGES.pickRate),
    raw: meta,
  };
}