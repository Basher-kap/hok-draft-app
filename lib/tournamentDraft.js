// Tournament Draft structure (as specified):
//
// Each GAME in the series runs two ban/pick phases:
//   Phase 1 - Ban:  A, B, A, B                 (4 bans, 2 per side)
//   Phase 1 - Pick: A, B, B, A, A, B            (6 picks, 3 per side)
//   Phase 2 - Ban:  B, A, B, A                 (4 bans, 2 per side)
//   Phase 2 - Pick: B, A, A, B                 (4 picks, 2 per side)
// => 8 bans total (4 per side) + 10 picks total (5 per side) per game.
//
// Bans are per-game (reset every game). Unlike Rank Draft, duplicate bans
// across sides are NOT allowed here - once either team bans a hero, it's
// off the board for the rest of that game and neither side can ban it
// again (whether in Phase 1 or Phase 2).
//
// Picks are GLOBAL per team across the whole series: once a team has
// picked a hero in an earlier game of the series, that team cannot pick
// it again in a later game - but the opposing team is free to pick it.
//
// The series itself (Bo3 / Bo5 / Bo7) advances manually via "Next Game" -
// there's no win/loss tracking, just a game counter capped at the chosen
// match length.

export const PHASE1_BAN_ORDER = ["A", "B", "A", "B"];
export const PHASE1_PICK_ORDER = ["A", "B", "B", "A", "A", "B"];
export const PHASE2_BAN_ORDER = ["B", "A", "B", "A"];
export const PHASE2_PICK_ORDER = ["B", "A", "A", "B"];

// Flattened, ordered list of every step in a single game's draft.
const STEPS = [
  ...PHASE1_BAN_ORDER.map((team, i) => ({ phase: "ban", subPhase: 1, team, indexInPhase: i })),
  ...PHASE1_PICK_ORDER.map((team, i) => ({ phase: "pick", subPhase: 1, team, indexInPhase: i })),
  ...PHASE2_BAN_ORDER.map((team, i) => ({ phase: "ban", subPhase: 2, team, indexInPhase: i })),
  ...PHASE2_PICK_ORDER.map((team, i) => ({ phase: "pick", subPhase: 2, team, indexInPhase: i })),
];

export const TOTAL_BANS = PHASE1_BAN_ORDER.length + PHASE2_BAN_ORDER.length; // 8
export const TOTAL_PICKS = PHASE1_PICK_ORDER.length + PHASE2_PICK_ORDER.length; // 10
export const TOTAL_STEPS = STEPS.length; // 18

export const BANS_PER_SIDE = TOTAL_BANS / 2; // 4
export const PICKS_PER_SIDE = TOTAL_PICKS / 2; // 5

export const MATCH_LENGTHS = [3, 5, 7];

// Returns the draft "step" descriptor for a given step index (0-based),
// with running ban/pick counters mixed in for progress display.
export function getStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= TOTAL_STEPS) {
    return { phase: "complete", team: null, subPhase: null, index: -1 };
  }
  const s = STEPS[stepIndex];

  // Overall ban/pick index (across both sub-phases) for progress bars.
  let banIndex = null;
  let pickIndex = null;
  if (s.phase === "ban") {
    banIndex = s.subPhase === 1 ? s.indexInPhase : PHASE1_BAN_ORDER.length + s.indexInPhase;
  } else {
    pickIndex = s.subPhase === 1 ? s.indexInPhase : PHASE1_PICK_ORDER.length + s.indexInPhase;
  }

  return { ...s, index: s.phase === "ban" ? banIndex : pickIndex, banIndex, pickIndex };
}

// ---- Single game state ----------------------------------------------

export function initialGameState() {
  return {
    step: 0,
    bans: { A: [], B: [] },
    picks: { A: [], B: [] }, // { slug, role }[]
  };
}

export function isGameDraftComplete(gameState) {
  return gameState.step >= TOTAL_STEPS;
}

export function isHeroPickedThisGame(gameState, slug) {
  return gameState.picks.A.some((p) => p.slug === slug) || gameState.picks.B.some((p) => p.slug === slug);
}

export function isHeroBannedByTeamThisGame(gameState, team, slug) {
  return gameState.bans[team].includes(slug);
}

export function isHeroBannedByAnyoneThisGame(gameState, slug) {
  return gameState.bans.A.includes(slug) || gameState.bans.B.includes(slug);
}

// ---- Series state ------------------------------------------------------

export function initialSeriesState(matchLength = 3) {
  return {
    matchLength,
    game: 1,
    current: initialGameState(),
    seriesPicks: { A: [], B: [] }, // slugs locked in by completed games, per team
    gameHistory: [], // snapshots of completed games' { bans, picks }
  };
}

export function isSeriesComplete(seriesState) {
  return isGameDraftComplete(seriesState.current) && seriesState.game >= seriesState.matchLength;
}

export function canAdvanceGame(seriesState) {
  return isGameDraftComplete(seriesState.current) && !isSeriesComplete(seriesState);
}

// A hero is locked out for `team` if that team already picked it in a
// PREVIOUS (completed) game of the series. Does not affect the other team.
export function isHeroLockedForTeam(seriesState, team, slug) {
  return seriesState.seriesPicks[team].includes(slug);
}

// role is required for pick-phase actions (same convention as Rank Draft -
// the lane a flex hero is being drafted for). Ignored for ban actions.
export function applyAction(seriesState, heroSlug, role = null) {
  const step = getStep(seriesState.current.step);
  if (step.phase === "complete") return seriesState;

  const current = {
    step: seriesState.current.step + 1,
    bans: { A: [...seriesState.current.bans.A], B: [...seriesState.current.bans.B] },
    picks: { A: [...seriesState.current.picks.A], B: [...seriesState.current.picks.B] },
  };

  if (step.phase === "ban") {
    current.bans[step.team].push(heroSlug);
  } else {
    current.picks[step.team].push({ slug: heroSlug, role });
  }

  return { ...seriesState, current };
}

// Whether `slug` can currently be chosen for the action at `step`.
// Ban phase: blocked if EITHER side has already banned this hero this
// game (no duplicate bans - unlike Rank Draft, bans are a single shared
// pool for the game, scoped to THIS game only since bans reset every game).
// Pick phase: blocked by a hero already picked/banned by anyone this
// game, OR by the acting team's own series-wide pick lock - the enemy
// team is unaffected by that lock.
export function isSelectable(seriesState, step, slug) {
  const current = seriesState.current;
  if (step.phase === "ban") {
    return !isHeroPickedThisGame(current, slug) && !isHeroBannedByAnyoneThisGame(current, slug);
  }
  if (step.phase === "pick") {
    return (
      !isHeroPickedThisGame(current, slug) &&
      !isHeroBannedByAnyoneThisGame(current, slug) &&
      !isHeroLockedForTeam(seriesState, step.team, slug)
    );
  }
  return false;
}

// Archives the just-finished game into gameHistory + seriesPicks, then
// opens a fresh board for the next game. Only valid when canAdvanceGame().
export function advanceToNextGame(seriesState) {
  if (!canAdvanceGame(seriesState)) return seriesState;

  const finished = seriesState.current;
  return {
    ...seriesState,
    game: seriesState.game + 1,
    current: initialGameState(),
    seriesPicks: {
      A: [...seriesState.seriesPicks.A, ...finished.picks.A.map((p) => p.slug)],
      B: [...seriesState.seriesPicks.B, ...finished.picks.B.map((p) => p.slug)],
    },
    gameHistory: [...seriesState.gameHistory, finished],
  };
}