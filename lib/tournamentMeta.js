// Pro/tournament-scene meta stats (Tournament Draft only) - sourced from
// Liquipedia's Philippines Kings League 2026 Fall statistics page:
// https://liquipedia.net/honorofkings/Philippines_Kings_League/2026/Fall/Statistics
// This is deliberately separate from Rank Draft's data (lib/rankedMeta.js,
// sourced from the ranked ladder via HOK Camp) - pro-scene drafting and
// ranked-ladder drafting optimize for different things, and the two
// metas can and do diverge a lot (a hero can be a ranked-ladder menace
// but rarely see pro play, or vice versa).
//
// IMPORTANT - PARTIAL SEASON: captured after only 79 games (Regular
// Season Weeks 1-2 of PKL Fall 2026, played 2026-08-27 through
// 2026-09-06). This is a much smaller sample than the full-season ranked
// ladder data - treat early-week swings (e.g. a hero going 100% in 1-2
// games) with proportionally less confidence. Re-fetch and paste over
// this file as the season progresses to keep it current.
//
// Rates below are computed the same way the source page presents them:
//   pickRate = hero's picks / 79 games played, as a percentage
//   banRate  = hero's bans  / 79 games played, as a percentage
//   winRate  = hero's wins / (wins + losses) across its own picks
// A hero with no picks or bans in this stretch simply has no entry here
// (31 of 116 heroes weren't touched at all in these 79 games) - it falls
// back to the generic tier, same as before this file had any data.
export const TOURNAMENT_META_SOURCE = {
  source: "Liquipedia - Philippines Kings League 2026 Fall Statistics",
  url: "https://liquipedia.net/honorofkings/Philippines_Kings_League/2026/Fall/Statistics",
  gamesPlayed: 79,
  coverage: "Regular Season Weeks 1-2 (2026-08-27 to 2026-09-06)",
  capturedAt: "2026-09-13",
  note: "Partial season - small sample, will shift as more games are played.",
};

export const TOURNAMENT_META = {
  aoyin: { banRate: 30.38, winRate: 51.52, pickRate: 41.77 },
  "zhang-fei": { banRate: 43.04, winRate: 66.67, pickRate: 37.97 },
  lapulapu: { banRate: 21.52, winRate: 56.67, pickRate: 37.97 },
  chicha: { banRate: 18.99, winRate: 53.85, pickRate: 32.91 },
  "mai-shiranui": { banRate: 44.3, winRate: 56, pickRate: 31.65 },
  chano: { banRate: 20.25, winRate: 48, pickRate: 31.65 },
  mozi: { banRate: 8.86, winRate: 41.67, pickRate: 30.38 },
  zilong: { banRate: 12.66, winRate: 52.17, pickRate: 29.11 },
  dharma: { banRate: 13.92, winRate: 59.09, pickRate: 27.85 },
  lorion: { banRate: 55.7, winRate: 54.55, pickRate: 27.85 },
  pei: { banRate: 60.76, winRate: 50, pickRate: 27.85 },
  "flowborn-marksman": { banRate: 16.46, winRate: 27.27, pickRate: 27.85 },
  "guan-yu": { banRate: 41.77, winRate: 61.9, pickRate: 26.58 },
  biron: { banRate: 10.13, winRate: 19.05, pickRate: 26.58 },
  charlotte: { banRate: 10.13, winRate: 52.63, pickRate: 24.05 },
  dyadia: { banRate: 11.39, winRate: 42.11, pickRate: 24.05 },
  "lian-po": { banRate: 5.06, winRate: 38.89, pickRate: 22.78 },
  nuwa: { banRate: 12.66, winRate: 38.89, pickRate: 22.78 },
  yuhuan: { banRate: 8.86, winRate: 52.94, pickRate: 21.52 },
  augran: { banRate: 24.05, winRate: 50, pickRate: 20.25 },
  feyd: { banRate: 12.66, winRate: 60, pickRate: 18.99 },
  ata: { banRate: 12.66, winRate: 57.14, pickRate: 17.72 },
  florentino: { banRate: 27.85, winRate: 57.14, pickRate: 17.72 },
  devara: { banRate: 1.27, winRate: 50, pickRate: 17.72 },
  haya: { banRate: 63.29, winRate: 50, pickRate: 17.72 },
  angela: { banRate: 1.27, winRate: 61.54, pickRate: 16.46 },
  garuda: { banRate: 7.59, winRate: 38.46, pickRate: 16.46 },
  "xiao-qiao": { banRate: 17.72, winRate: 30.77, pickRate: 16.46 },
  yixing: { banRate: 1.27, winRate: 58.33, pickRate: 15.19 },
  jing: { banRate: 24.05, winRate: 72.73, pickRate: 13.92 },
  "ukyo-tachibana": { banRate: 17.72, winRate: 63.64, pickRate: 13.92 },
  annette: { banRate: 2.53, winRate: 54.55, pickRate: 13.92 },
  arli: { banRate: 3.8, winRate: 36.36, pickRate: 13.92 },
  mayene: { banRate: 5.06, winRate: 62.5, pickRate: 10.13 },
  kaizer: { banRate: 2.53, winRate: 37.5, pickRate: 10.13 },
  fatih: { banRate: 2.53, winRate: 25, pickRate: 10.13 },
  ying: { banRate: 1.27, winRate: 12.5, pickRate: 10.13 },
  shouyue: { banRate: 1.27, winRate: 85.71, pickRate: 8.86 },
  "consort-yu": { banRate: 2.53, winRate: 42.86, pickRate: 8.86 },
  menki: { banRate: 8.86, winRate: 42.86, pickRate: 8.86 },
  umbrosa: { banRate: 0, winRate: 42.86, pickRate: 8.86 },
  dolia: { banRate: 0, winRate: 28.57, pickRate: 8.86 },
  erin: { banRate: 5.06, winRate: 14.29, pickRate: 8.86 },
  nezha: { banRate: 8.86, winRate: 66.67, pickRate: 7.59 },
  alessio: { banRate: 0, winRate: 60, pickRate: 6.33 },
  luna: { banRate: 11.39, winRate: 20, pickRate: 6.33 },
  kongming: { banRate: 1.27, winRate: 75, pickRate: 5.06 },
  liang: { banRate: 10.13, winRate: 75, pickRate: 5.06 },
  nakoruru: { banRate: 0, winRate: 75, pickRate: 5.06 },
  "wang-zhaojun": { banRate: 0, winRate: 75, pickRate: 5.06 },
  kui: { banRate: 1.27, winRate: 50, pickRate: 5.06 },
  "liu-bang": { banRate: 1.27, winRate: 50, pickRate: 5.06 },
  agudo: { banRate: 15.19, winRate: 25, pickRate: 5.06 },
  "yang-jian": { banRate: 1.27, winRate: 25, pickRate: 5.06 },
  "lady-sun": { banRate: 0, winRate: 33.33, pickRate: 3.8 },
  "lady-zhen": { banRate: 1.27, winRate: 33.33, pickRate: 3.8 },
  shi: { banRate: 3.8, winRate: 33.33, pickRate: 3.8 },
  ziya: { banRate: 0, winRate: 33.33, pickRate: 3.8 },
  "di-renjie": { banRate: 2.53, winRate: 100, pickRate: 2.53 },
  "flowborn-tank": { banRate: 15.19, winRate: 100, pickRate: 2.53 },
  luara: { banRate: 0, winRate: 100, pickRate: 2.53 },
  yango: { banRate: 0, winRate: 100, pickRate: 2.53 },
  fuzi: { banRate: 0, winRate: 50, pickRate: 2.53 },
  "sun-bin": { banRate: 0, winRate: 50, pickRate: 2.53 },
  "sun-ce": { banRate: 0, winRate: 50, pickRate: 2.53 },
  "bai-qi": { banRate: 3.8, winRate: 0, pickRate: 2.53 },
  lam: { banRate: 0, winRate: 0, pickRate: 2.53 },
  musashi: { banRate: 12.66, winRate: 0, pickRate: 2.53 },
  "xiang-yu": { banRate: 0, winRate: 0, pickRate: 2.53 },
  arthur: { banRate: 0, winRate: 100, pickRate: 1.27 },
  "gan-mo": { banRate: 1.27, winRate: 100, pickRate: 1.27 },
  "gao-changgong": { banRate: 1.27, winRate: 100, pickRate: 1.27 },
  "han-xin": { banRate: 0, winRate: 100, pickRate: 1.27 },
  heino: { banRate: 0, winRate: 100, pickRate: 1.27 },
  "hou-yi": { banRate: 1.27, winRate: 100, pickRate: 1.27 },
  "li-xin": { banRate: 0, winRate: 100, pickRate: 1.27 },
  "lu-bu": { banRate: 1.27, winRate: 100, pickRate: 1.27 },
  "marco-polo": { banRate: 0, winRate: 100, pickRate: 1.27 },
  "meng-ya": { banRate: 0, winRate: 100, pickRate: 1.27 },
  "mi-yue": { banRate: 0, winRate: 100, pickRate: 1.27 },
  sakeer: { banRate: 0, winRate: 100, pickRate: 1.27 },
  yao: { banRate: 0, winRate: 100, pickRate: 1.27 },
  dun: { banRate: 0, winRate: 0, pickRate: 1.27 },
  "zhou-yu": { banRate: 0, winRate: 0, pickRate: 1.27 },
  // Fang: 0 picks (no win rate signal), 1 ban only.
  fang: { banRate: 1.27, winRate: 0, pickRate: 0 },
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