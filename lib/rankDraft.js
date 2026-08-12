// Rank Draft structure (as specified):
//   Phase 1 - Bans:  3 per side (6 total), single phase, no split
//   Phase 2 - Picks: 5 per team (10 total)
//
// Ban order is 3 consecutive bans for Team A (blue), then 3 consecutive
// bans for Team B (red) — not alternating. Unlike a tournament draft where
// each side can see and react to what the other has already banned,
// ranked ban selection isn't sequenced with that kind of visibility, so
// it's possible for both sides to end up banning the same hero (a wasted
// ban on one side). isHeroBannableByTeam below reflects that: a team can't
// re-ban a hero it already banned itself, but isn't blocked from banning a
// hero the other side already has — see isHeroBannableByTeam.
//
// Picks still follow a snake order so no team picks back-to-back unfairly.
// Both orders are easy to change here in one place if the real HoK ranked
// order differs.

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

// Ban-phase eligibility for the ACTIVE team specifically: a team can't
// re-ban a hero it already banned itself, but — since bans aren't
// alternating-with-visibility in ranked — it's still allowed to ban a hero
// the OTHER team already banned. That just means the ban was wasted (the
// hero was already unavailable), which is a real outcome, not a bug.
export function isHeroBannableByTeam(state, heroSlug, team) {
  return !state.bans[team].includes(heroSlug);
}

// Full, real availability once all bans are visible (pick phase / draft
// review): true if EITHER team has banned or picked this hero.
export function isHeroTaken(state, heroSlug) {
  return (
    state.bans.A.includes(heroSlug) ||
    state.bans.B.includes(heroSlug) ||
    state.picks.A.some((p) => p.slug === heroSlug) ||
    state.picks.B.some((p) => p.slug === heroSlug)
  );
}