// Rank Draft structure (as specified):
//   Phase 1 - Bans: 3 per side (6 total), consecutive per side (not
//   alternating) - Team A bans 3 in a row, then Team B bans 3 in a row.
//   Because this isn't alternating/simultaneous, bans are effectively
//   "blind" between sides: Team B can end up banning a hero Team A
//   already banned, wasting a ban slot on both sides. A team just can't
//   ban the same hero twice itself.
//   Phase 2 - Picks: 5 per team (10 total), snake order so no team picks
//   back-to-back unfairly.

export const BAN_ORDER = ["A", "A", "A", "B", "B", "B"];

export const PICK_ORDER = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B"];

export const TOTAL_BANS = BAN_ORDER.length;
export const TOTAL_PICKS = PICK_ORDER.length;
export const TOTAL_STEPS = TOTAL_BANS + TOTAL_PICKS;

// Returns the draft "step" descriptor for a given step index (0-based).
export function getStep(stepIndex) {
  if (stepIndex < TOTAL_BANS) {
    return { phase: "ban", team: BAN_ORDER[stepIndex], index: stepIndex };
  }
  if (stepIndex < TOTAL_STEPS) {
    const pickIndex = stepIndex - TOTAL_BANS;
    return { phase: "pick", team: PICK_ORDER[pickIndex], index: pickIndex };
  }
  return { phase: "complete", team: null, index: -1 };
}

export function initialDraftState() {
  return {
    step: 0,
    bans: { A: [], B: [] }, // arrays of hero slugs - duplicates across A/B allowed
    picks: { A: [], B: [] },
  };
}

export function applyAction(state, heroSlug) {
  const step = getStep(state.step);
  if (step.phase === "complete") return state;

  const next = {
    step: state.step + 1,
    bans: { A: [...state.bans.A], B: [...state.bans.B] },
    picks: { A: [...state.picks.A], B: [...state.picks.B] },
  };

  if (step.phase === "ban") {
    next.bans[step.team].push(heroSlug);
  } else {
    next.picks[step.team].push(heroSlug);
  }
  return next;
}

export function isHeroPicked(state, slug) {
  return state.picks.A.includes(slug) || state.picks.B.includes(slug);
}

export function isHeroBannedByTeam(state, team, slug) {
  return state.bans[team].includes(slug);
}

export function isHeroBannedByAnyone(state, slug) {
  return state.bans.A.includes(slug) || state.bans.B.includes(slug);
}

// Whether `slug` can currently be chosen for the action at `step`.
// Ban phase: blocked only by an already-picked hero (guard, shouldn't
// happen given ban-then-pick ordering) or the CURRENT team having already
// banned it - NOT blocked by the other team's bans, since duplicate bans
// across sides are allowed.
// Pick phase: blocked by an already-picked hero, or a hero banned by
// EITHER team.
export function isSelectable(state, step, slug) {
  if (step.phase === "ban") {
    return !isHeroPicked(state, slug) && !isHeroBannedByTeam(state, step.team, slug);
  }
  if (step.phase === "pick") {
    return !isHeroPicked(state, slug) && !isHeroBannedByAnyone(state, slug);
  }
  return false;
}

// Kept for any external code expecting the old "fully taken" check -
// now only meaningful in pick-phase-equivalent terms (banned by anyone
// OR picked by anyone). Ban-phase selectability should use isSelectable.
export function isHeroTaken(state, slug) {
  return isHeroBannedByAnyone(state, slug) || isHeroPicked(state, slug);
}