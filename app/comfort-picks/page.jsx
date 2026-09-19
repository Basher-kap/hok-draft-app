"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X as XIcon, ArrowLeft, Search, RotateCcw } from "lucide-react";
import { ROLES, ROLE_COLOR, sortByTier } from "@/lib/heroes";
import { useComfort } from "@/components/ComfortProvider";
import { useComfortTier } from "@/components/ComfortTierProvider";
import { useTierList } from "@/components/TierListProvider";
import { COMFORT_TIER_ORDER, COMFORT_TIER_LABELS, COMFORT_TIER_DESCRIPTIONS } from "@/lib/comfortHeroes";
import HeroCard from "@/components/HeroCard";

const COMFORT_COLOR = "#e879f9";
const SUPER_COMFORT_COLOR = "#ff2d95";

// Five-tier model's per-tier accent colors, brightest/most-committed
// (priority) down to loosest (wildcard).
const TIER_COLOR = {
  priority: "#ff2d95",
  reserve: "#e879f9",
  common: "#60a5fa",
  adjust: "#fbbf24",
  wildcard: "#34d399",
};

// Wraps the shared HeroCard (same visual style as the Rank Draft grid)
// in native HTML5 drag behavior for the pool.
function DraggablePoolCard({ hero }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", hero.slug);
        e.dataTransfer.effectAllowed = "copy";
      }}
      style={{ width: 108, flexShrink: 0, cursor: "grab" }}
    >
      <HeroCard hero={hero} status="available" />
    </div>
  );
}

function AssignedHeroRow({ hero, lane, accent, onRemove }) {
  const offRole = !hero.roles.includes(lane);
  return (
    <div
      className="flex items-center gap-1.5 rounded px-1.5 py-1"
      style={{ background: "#1a1e26", border: `1px solid ${accent}33` }}
    >
      <div className="relative w-5 h-6 rounded overflow-hidden shrink-0 bg-[#0f1115]">
        <Image src={hero.image} alt={hero.name} fill className="object-contain" unoptimized />
      </div>
      <span className="font-display font-semibold text-[11px] flex-1 truncate" style={{ color: "#e8e6e1" }}>
        {hero.name}
      </span>
      {offRole && (
        <span
          className="font-body text-[7.5px] font-semibold rounded px-1 py-0.5 shrink-0"
          style={{ color: "#12141a", background: accent }}
          title={`Off-role: ${hero.name}'s listed lane(s) are ${hero.roles.join(", ")}`}
        >
          OFF
        </span>
      )}
      <button onClick={onRemove} className="shrink-0 text-gray-500 hover:text-red-400 transition-colors">
        <XIcon size={12} />
      </button>
    </div>
  );
}

// ---- Manual (Super Comfort / Comfort) grid -----------------------------

function LevelZone({ lane, level, assignedSlugs, onDrop, onRemove, roster }) {
  const [isOver, setIsOver] = useState(false);
  const isSuper = level === "super";
  const accent = isSuper ? SUPER_COMFORT_COLOR : COMFORT_COLOR;
  const heroes = [...assignedSlugs].map((slug) => roster.find((h) => h.slug === slug)).filter(Boolean);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const slug = e.dataTransfer.getData("text/plain");
        if (slug) onDrop(lane, level, slug);
      }}
      className="flex flex-col rounded-md transition-colors"
      style={{
        minHeight: 84,
        border: `1.5px dashed ${isOver ? accent : accent + "35"}`,
        background: isOver ? `${accent}18` : "transparent",
      }}
    >
      <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1">
        <span className="font-display font-bold text-[10px] tracking-wide" style={{ color: accent }}>
          {isSuper ? "SUPER COMFORT" : "COMFORT"}
        </span>
        <span className="font-body text-[10px] text-gray-500 ml-auto">{heroes.length}</span>
      </div>

      <div className="flex flex-col gap-1 px-1.5 pb-1.5 flex-1">
        {heroes.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-2">
            <span className="font-body text-[10px] text-gray-600">Drop here</span>
          </div>
        )}
        {heroes.map((hero) => (
          <AssignedHeroRow key={hero.slug} hero={hero} lane={lane} accent={accent} onRemove={() => onRemove(lane, level, hero.slug)} />
        ))}
      </div>
    </div>
  );
}

function ManualLaneColumn({ lane, assignments, onDrop, onRemove, roster }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[lane] }} />
        <span className="font-display font-bold text-sm tracking-wide" style={{ color: ROLE_COLOR[lane] }}>
          {lane.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <LevelZone lane={lane} level="super" assignedSlugs={assignments.super} onDrop={onDrop} onRemove={onRemove} roster={roster} />
        <LevelZone lane={lane} level="comfort" assignedSlugs={assignments.comfort} onDrop={onDrop} onRemove={onRemove} roster={roster} />
      </div>
    </div>
  );
}

// ---- Tier model (Priority / Reserve / Common / Adjust / Wildcard) grid -

function TierZone({ lane, tier, assignedSlugs, onDrop, onRemove, roster }) {
  const [isOver, setIsOver] = useState(false);
  const accent = TIER_COLOR[tier];
  const heroes = [...assignedSlugs].map((slug) => roster.find((h) => h.slug === slug)).filter(Boolean);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const slug = e.dataTransfer.getData("text/plain");
        if (slug) onDrop(lane, tier, slug);
      }}
      className="flex flex-col rounded-md transition-colors"
      style={{
        minHeight: 56,
        border: `1.5px dashed ${isOver ? accent : accent + "35"}`,
        background: isOver ? `${accent}18` : "transparent",
      }}
      title={COMFORT_TIER_DESCRIPTIONS[tier]}
    >
      <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1">
        <span className="font-display font-bold text-[10px] tracking-wide" style={{ color: accent }}>
          {COMFORT_TIER_LABELS[tier].toUpperCase()}
        </span>
        <span className="font-body text-[10px] text-gray-500 ml-auto">{heroes.length}</span>
      </div>

      <div className="flex flex-col gap-1 px-1.5 pb-1.5 flex-1">
        {heroes.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-1.5">
            <span className="font-body text-[10px] text-gray-600">Drop here</span>
          </div>
        )}
        {heroes.map((hero) => (
          <AssignedHeroRow key={hero.slug} hero={hero} lane={lane} accent={accent} onRemove={() => onRemove(lane, tier, hero.slug)} />
        ))}
      </div>
    </div>
  );
}

function TierLaneColumn({ lane, laneAssignments, onDrop, onRemove, roster }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[lane] }} />
        <span className="font-display font-bold text-sm tracking-wide" style={{ color: ROLE_COLOR[lane] }}>
          {lane.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {COMFORT_TIER_ORDER.map((tier) => (
          <TierZone
            key={tier}
            lane={lane}
            tier={tier}
            assignedSlugs={laneAssignments[tier]}
            onDrop={onDrop}
            onRemove={onRemove}
            roster={roster}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Page ----------------------------------------------------------------

export default function ComfortPicksPage() {
  const router = useRouter();
  const { comfortAssignments, assignComfort, removeComfort, totalAssignments } = useComfort();
  const {
    assignments: tierAssignments,
    assignTier,
    removeTier,
    resetToDefault,
    totalAssignments: totalTierAssignments,
  } = useComfortTier();
  const { effectiveHeroesFor } = useTierList();
  // Comfort picks apply across both draft modes, so the pool/badges here
  // just need one consistent tier reference - ranked is the primary list.
  const effectiveHeroes = effectiveHeroesFor("ranked");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("tier"); // "manual" | "tier"

  const pool = sortByTier(effectiveHeroes).filter((hero) =>
    query.trim() ? hero.name.toLowerCase().includes(query.trim().toLowerCase()) : true
  );

  const isTierView = viewMode === "tier";

  return (
    <div className="min-h-screen" style={{ background: "#12141a", color: "#e8e6e1" }}>
      {/* Sticky header + hero pool - stays visible while lane columns below scroll.
          Cards here use the same HeroCard component as the Rank Draft grid. */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-4"
        style={{ background: "#12141a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <div className="text-center">
              <h1 className="font-display font-bold text-xl tracking-wide" style={{ color: "#f2efe9" }}>
                COMFORT HEROES
              </h1>
              <p className="font-body text-[11px] text-gray-500">
                {isTierView
                  ? `Drag into Priority \u2192 Wildcard, any lane \u2014 ${totalTierAssignments} assigned`
                  : `Drag into Super Comfort or Comfort, any lane \u2014 ${totalAssignments} assigned`}
              </p>
            </div>
            <button
              onClick={() => router.push("/rank-draft")}
              className="font-display font-bold text-sm tracking-wide rounded-md px-5 py-2 transition-all"
              style={{ background: COMFORT_COLOR, color: "#12141a" }}
            >
              Done
            </button>
          </div>

          {/* Manual vs. Tier-model switch - both grids are always live in
              the recommendation engine at once; this only controls which
              one you're currently editing. */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setViewMode("tier")}
                className="font-display font-bold text-[11px] tracking-wide px-3 py-1.5 transition-colors"
                style={{
                  background: isTierView ? TIER_COLOR.priority : "transparent",
                  color: isTierView ? "#12141a" : "#8a94a6",
                }}
              >
                TIER MODEL
              </button>
              <button
                onClick={() => setViewMode("manual")}
                className="font-display font-bold text-[11px] tracking-wide px-3 py-1.5 transition-colors"
                style={{
                  background: !isTierView ? COMFORT_COLOR : "transparent",
                  color: !isTierView ? "#12141a" : "#8a94a6",
                }}
              >
                MANUAL
              </button>
            </div>
            {isTierView && (
              <button
                onClick={() => {
                  if (window.confirm("Reset the tier model back to the shipped defaults? This clears any edits you've made.")) {
                    resetToDefault();
                  }
                }}
                className="flex items-center gap-1.5 font-display font-semibold text-[11px] tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
              >
                <RotateCcw size={12} /> Reset to default
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-display font-semibold text-[11px] tracking-wide text-gray-500">
              DRAG FROM POOL ({pool.length})
            </span>
            <div className="relative w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hero..."
                className="w-full rounded px-8 py-1.5 text-[13px] outline-none font-body"
                style={{
                  background: "#1a1e26",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e8e6e1",
                }}
              />
              {query && (
                <XIcon
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                  onClick={() => setQuery("")}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {pool.map((hero) => (
              <DraggablePoolCard key={hero.slug} hero={hero} />
            ))}
            {pool.length === 0 && (
              <div className="w-full text-center py-6 text-gray-500 font-display text-sm">
                No heroes match &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lane columns - Tier model (5 zones) or Manual (2 zones), per viewMode */}
      <div className="max-w-[1280px] mx-auto px-5 py-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ROLES.length}, 1fr)` }}>
          {isTierView
            ? ROLES.map((lane) => (
                <TierLaneColumn
                  key={lane}
                  lane={lane}
                  laneAssignments={tierAssignments[lane]}
                  onDrop={assignTier}
                  onRemove={removeTier}
                  roster={effectiveHeroes}
                />
              ))
            : ROLES.map((lane) => (
                <ManualLaneColumn
                  key={lane}
                  lane={lane}
                  assignments={comfortAssignments[lane]}
                  onDrop={assignComfort}
                  onRemove={removeComfort}
                  roster={effectiveHeroes}
                />
              ))}
        </div>
      </div>
    </div>
  );
}