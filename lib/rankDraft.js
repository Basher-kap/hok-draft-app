// Rank Draft structure (as specified):
//   Phase 1 - Bans:  3 per side (6 total), single phase, no split
//   Phase 2 - Picks: 5 per team (10 total)
//
// Assumption (flagged for confirmation): bans alternate A/B so each side
// gets all 3 of their bans across the phase without either team banning
// twice in a row. Picks follow a snake order so no team picks
// back-to-back unfairly. Both are easy to change here in one place if the
// real HoK ranked order differs.

export const BAN_ORDER = ["A", "B", "A", "B", "A", "B"];

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
    bans: { A: [], B: [] }, // arrays of hero slugs
    picks: { A: [], B: [] }, // arrays of { slug, role } - role is the lane this hero was drafted to play
  };
}

// role is required for picks (the lane the player chose for that hero — matters
// for flex heroes like Kongming, who can go Mid or Jungle). Ignored for bans.
export function applyAction(state, heroSlug, role = null) {
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
    next.picks[step.team].push({ slug: heroSlug, role });
  }
  return next;
}

export function isHeroTaken(state, heroSlug) {
  return (
    state.bans.A.includes(heroSlug) ||
    state.bans.B.includes(heroSlug) ||
    state.picks.A.some((p) => p.slug === heroSlug) ||
    state.picks.B.some((p) => p.slug === heroSlug)
  );
}