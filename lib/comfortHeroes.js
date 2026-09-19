// Basher's own comfort-hero tiering, per lane - a fixed, five-level
// "how confident am I picking this in a real draft" model, distinct from
// the manual super/comfort assignments in ComfortProvider (which stay
// user-editable and untouched by this file). This is meant as a
// standing, always-on signal describing pick priority/timing, not
// something the user builds up hero-by-hero in the UI.
//
// Tier meaning (source: Basher, comfort-heroes table):
//   priority - first-pick contenders, the go-to core of the draft
//   reserve  - second to priority; still a strong first pick, but also
//              a comfort fallback
//   common   - usually 3rd/4th pick; fine to take, still solid
//   adjust   - usually 4th/5th pick, taken to counter something or round
//              out the lineup synergy of picks already on the board
//   wildcard - super-comfort pool; picked whenever the moment calls for
//              it (countering or synergizing with the live draft), not
//              tied to a particular pick number
//
// Keyed by lane exactly as lib/heroes.js's ROLES spells them ("Clash
// Lane", "Jungle", "Mid", "Farm", "Roam"), each holding hero slugs at
// that tier. A hero can appear under more than one lane (e.g. a flex
// pick) and, in principle, at different tiers per lane.
import comfortHeroesData from "@/data/comfort-heroes.json";

export const COMFORT_TIER_ORDER = ["priority", "reserve", "common", "adjust", "wildcard"];

export const COMFORT_TIER_LABELS = {
  priority: "Priority",
  reserve: "Reserve",
  common: "Common",
  adjust: "Adjust",
  wildcard: "Wildcard",
};

export const COMFORT_TIER_DESCRIPTIONS = {
  priority: "First-pick contender - the core of the draft",
  reserve: "Strong first pick and a comfort fallback",
  common: "Solid 3rd/4th pick",
  adjust: "4th/5th pick - counters something or completes lineup synergy",
  wildcard: "Super-comfort pool - picked whenever the moment calls for it",
};

// slug -> tier, per lane. Built once from the JSON data so lookups don't
// re-scan the tier lists on every call.
const LANE_INDEX = {};
Object.entries(comfortHeroesData).forEach(([lane, tiers]) => {
  const bySlug = {};
  COMFORT_TIER_ORDER.forEach((tier) => {
    (tiers[tier] || []).forEach((slug) => {
      bySlug[slug] = tier;
    });
  });
  LANE_INDEX[lane] = bySlug;
});

// Returns "priority" | "reserve" | "common" | "adjust" | "wildcard" | null
export function comfortTierFor(lane, slug) {
  return LANE_INDEX[lane]?.[slug] || null;
}

// Every lane/tier this hero shows up under, e.g. Yuhuan ->
// [{ lane: "Mid", tier: "adjust" }, { lane: "Roam", tier: "adjust" }].
export function comfortTiersForHero(slug) {
  const hits = [];
  Object.entries(LANE_INDEX).forEach(([lane, bySlug]) => {
    if (bySlug[slug]) hits.push({ lane, tier: bySlug[slug] });
  });
  return hits;
}