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
// Source date: Sep 4, 2026 · Captured: Sep 5, 2026 · Scope: International
// region 608, Ranked scope 1, Segment 255, 116/116 heroes.
// Values are percentages (0-100). Re-fetch and paste over this file
// periodically to keep it current - just ask, and provide the page again
// if it's stale.
export const RANKED_META_SOURCE = {
  source: "HOK Camp (via HoKStats.gg official-popularity mirror)",
  url: "https://hokstats.gg/official-popularity/",
  sourceDate: "2026-09-04",
  capturedAt: "2026-09-05",
};

export const RANKED_META = {
  // -- Clash Lane (30) --
  "li-xin": { banRate: 3, winRate: 51.4, pickRate: 2.2 },
  dun: { banRate: 0.6, winRate: 52.8, pickRate: 1.7 },
  chicha: { banRate: 0.4, winRate: 52.2, pickRate: 1.5 },
  kaizer: { banRate: 0.1, winRate: 50.7, pickRate: 1.4 },
  devara: { banRate: 0.3, winRate: 48.8, pickRate: 1.2 },
  "mi-yue": { banRate: 1.1, winRate: 50, pickRate: 0.8 },
  florentino: { banRate: 1.7, winRate: 51.8, pickRate: 0.5 },
  "lian-po": { banRate: 0.2, winRate: 52.6, pickRate: 1.2 },
  "lu-bu": { banRate: 0.3, winRate: 48.9, pickRate: 1.1 },
  arthur: { banRate: 0, winRate: 49.9, pickRate: 1.1 },
  umbrosa: { banRate: 0.1, winRate: 50.6, pickRate: 1 },
  "sun-ce": { banRate: 0, winRate: 48.4, pickRate: 0.9 },
  "xiang-yu": { banRate: 0, winRate: 50.8, pickRate: 0.7 },
  biron: { banRate: 0.2, winRate: 47.8, pickRate: 0.7 },
  charlotte: { banRate: 0.1, winRate: 49.6, pickRate: 0.7 },
  "flowborn-tank": { banRate: 0.1, winRate: 48.8, pickRate: 0.6 },
  ata: { banRate: 0, winRate: 52.8, pickRate: 0.5 },
  allain: { banRate: 0, winRate: 50.4, pickRate: 0.5 },
  "guan-yu": { banRate: 0.1, winRate: 47.5, pickRate: 0.4 },
  nezha: { banRate: 0, winRate: 52.7, pickRate: 0.4 },
  fatih: { banRate: 0.1, winRate: 52.8, pickRate: 0.4 },
  wuyan: { banRate: 0, winRate: 51.9, pickRate: 0.4 },
  fuzi: { banRate: 0, winRate: 52.7, pickRate: 0.4 },
  "bai-qi": { banRate: 0, winRate: 51.2, pickRate: 0.4 },
  mayene: { banRate: 0, winRate: 47.4, pickRate: 0.4 },
  mulan: { banRate: 0, winRate: 49.8, pickRate: 0.3 },
  "yang-jian": { banRate: 0, winRate: 50.8, pickRate: 0.3 },
  yango: { banRate: 0, winRate: 49.2, pickRate: 0.3 },
  "liu-bang": { banRate: 0, winRate: 51.2, pickRate: 0.3 },
  dharma: { banRate: 0, winRate: 52.8, pickRate: 0.3 },

  // -- Mid (26) --
  angela: { banRate: 1.4, winRate: 51.1, pickRate: 2.8 },
  daji: { banRate: 2.3, winRate: 51.3, pickRate: 2.8 },
  milady: { banRate: 1.8, winRate: 47.8, pickRate: 1.7 },
  mozi: { banRate: 1.7, winRate: 49.8, pickRate: 1.6 },
  liang: { banRate: 3.7, winRate: 50.7, pickRate: 0.8 },
  kongming: { banRate: 0.7, winRate: 51.4, pickRate: 1.9 },
  "wang-zhaojun": { banRate: 0.7, winRate: 50.9, pickRate: 1.7 },
  "xiao-qiao": { banRate: 0.3, winRate: 48.2, pickRate: 1.6 },
  haya: { banRate: 2.4, winRate: 48.2, pickRate: 1.1 },
  nuwa: { banRate: 0.6, winRate: 53.8, pickRate: 1 },
  "lady-zhen": { banRate: 0, winRate: 50.8, pickRate: 1 },
  shi: { banRate: 0.5, winRate: 51.4, pickRate: 0.9 },
  garuda: { banRate: 0, winRate: 51, pickRate: 0.8 },
  diaochan: { banRate: 0.1, winRate: 47.6, pickRate: 0.7 },
  heino: { banRate: 0.1, winRate: 47.7, pickRate: 0.7 },
  yixing: { banRate: 0, winRate: 51, pickRate: 0.7 },
  ziya: { banRate: 0.1, winRate: 50, pickRate: 0.6 },
  "mai-shiranui": { banRate: 0.1, winRate: 49.2, pickRate: 0.6 },
  "dr-bian": { banRate: 0.2, winRate: 50.2, pickRate: 0.5 },
  yuhuan: { banRate: 0, winRate: 49.5, pickRate: 0.5 },
  lorion: { banRate: 0.2, winRate: 51.1, pickRate: 0.4 },
  "flowborn-mage": { banRate: 0, winRate: 51.1, pickRate: 0.4 },
  gao: { banRate: 0, winRate: 52.1, pickRate: 0.4 },
  "zhou-yu": { banRate: 0, winRate: 51.3, pickRate: 0.4 },
  "gan-mo": { banRate: 0.1, winRate: 50, pickRate: 0.4 },
  shangguan: { banRate: 0, winRate: 48.8, pickRate: 0.4 },

  // -- Farm (18) --
  "hou-yi": { banRate: 0.2, winRate: 49.3, pickRate: 2.7 },
  aoyin: { banRate: 3.2, winRate: 49.5, pickRate: 1.6 },
  "luban-no-7": { banRate: 0.4, winRate: 51.9, pickRate: 2.1 },
  "marco-polo": { banRate: 0.3, winRate: 50, pickRate: 1.9 },
  "lady-sun": { banRate: 0.1, winRate: 49, pickRate: 1.8 },
  erin: { banRate: 0.2, winRate: 50.8, pickRate: 1.7 },
  "consort-yu": { banRate: 0.3, winRate: 51.9, pickRate: 1.7 },
  garo: { banRate: 0.4, winRate: 53.8, pickRate: 1.6 },
  "flowborn-marksman": { banRate: 0.1, winRate: 52.3, pickRate: 1.2 },
  fang: { banRate: 0, winRate: 49, pickRate: 1 },
  shouyue: { banRate: 0.1, winRate: 50.5, pickRate: 0.9 },
  luara: { banRate: 0.1, winRate: 46.4, pickRate: 0.9 },
  alessio: { banRate: 0, winRate: 52.4, pickRate: 0.9 },
  "di-renjie": { banRate: 0, winRate: 51.9, pickRate: 0.9 },
  chano: { banRate: 0.1, winRate: 51, pickRate: 0.8 },
  arli: { banRate: 0.2, winRate: 46.9, pickRate: 0.7 },
  "huang-zhong": { banRate: 0, winRate: 50.7, pickRate: 0.4 },
  "meng-ya": { banRate: 0, winRate: 52.3, pickRate: 0.4 },

  // -- Jungle (26) --
  augran: { banRate: 4, winRate: 49.6, pickRate: 1.6 },
  wukong: { banRate: 0.6, winRate: 49, pickRate: 1.4 },
  lam: { banRate: 1.1, winRate: 48.3, pickRate: 1.3 },
  "dian-wei": { banRate: 0.6, winRate: 50.7, pickRate: 1 },
  musashi: { banRate: 0.3, winRate: 49.5, pickRate: 0.9 },
  zilong: { banRate: 0, winRate: 54.4, pickRate: 0.9 },
  ying: { banRate: 0.1, winRate: 53.9, pickRate: 0.8 },
  "sima-yi": { banRate: 0.3, winRate: 53.5, pickRate: 0.7 },
  yao: { banRate: 0.1, winRate: 52, pickRate: 0.7 },
  luna: { banRate: 0.4, winRate: 46.2, pickRate: 0.6 },
  arke: { banRate: 0.8, winRate: 51.4, pickRate: 0.5 },
  feyd: { banRate: 0.3, winRate: 53.9, pickRate: 0.5 },
  "gao-changgong": { banRate: 1.1, winRate: 47.9, pickRate: 0.5 },
  butterfly: { banRate: 0.1, winRate: 51.7, pickRate: 0.5 },
  agudo: { banRate: 0, winRate: 53.7, pickRate: 0.5 },
  "li-bai": { banRate: 0.1, winRate: 52.2, pickRate: 0.5 },
  nakoruru: { banRate: 0.1, winRate: 49.7, pickRate: 0.5 },
  "ukyo-tachibana": { banRate: 0, winRate: 48.9, pickRate: 0.3 },
  jing: { banRate: 0.1, winRate: 45.8, pickRate: 0.3 },
  xuance: { banRate: 0.1, winRate: 54.2, pickRate: 0.3 },
  "liu-bei": { banRate: 0, winRate: 51.3, pickRate: 0.3 },
  pei: { banRate: 0.1, winRate: 50.9, pickRate: 0.3 },
  "han-xin": { banRate: 0, winRate: 47.6, pickRate: 0.3 },
  menki: { banRate: 0, winRate: 53.2, pickRate: 0.2 },
  cirrus: { banRate: 0, winRate: 51.7, pickRate: 0.2 },
  athena: { banRate: 0, winRate: 54.2, pickRate: 0.1 },

  // -- Roam (16) --
  dolia: { banRate: 1, winRate: 47, pickRate: 2.3 },
  "cai-yan": { banRate: 2.2, winRate: 51.2, pickRate: 1.2 },
  yaria: { banRate: 1.6, winRate: 49.4, pickRate: 1.1 },
  dyadia: { banRate: 1.3, winRate: 48.7, pickRate: 1 },
  donghuang: { banRate: 2.5, winRate: 48.3, pickRate: 0.7 },
  kui: { banRate: 0.5, winRate: 49.1, pickRate: 0.9 },
  "da-qiao": { banRate: 0.5, winRate: 48.5, pickRate: 0.9 },
  "liu-shan": { banRate: 0.1, winRate: 48.6, pickRate: 0.9 },
  "zhang-fei": { banRate: 0.4, winRate: 49.3, pickRate: 0.8 },
  zhuangzi: { banRate: 1.2, winRate: 47.8, pickRate: 0.6 },
  ming: { banRate: 0, winRate: 50.3, pickRate: 0.5 },
  sakeer: { banRate: 0, winRate: 52.7, pickRate: 0.5 },
  annette: { banRate: 0.1, winRate: 49.2, pickRate: 0.4 },
  lapulapu: { banRate: 0, winRate: 55.1, pickRate: 0.4 },
  "sun-bin": { banRate: 0, winRate: 48.8, pickRate: 0.3 },
  guiguzi: { banRate: 0.2, winRate: 51.1, pickRate: 0.2 },
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