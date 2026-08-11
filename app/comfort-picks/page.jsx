"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X as XIcon, ArrowLeft, GripVertical } from "lucide-react";
import { HEROES, ROLES, ROLE_COLOR, sortByTier } from "@/lib/heroes";
import { useComfort } from "@/components/ComfortProvider";
import HeroCard from "@/components/HeroCard";

const COMFORT_COLOR = "#e879f9";
const SUPER_COMFORT_COLOR = "#ff2d95";

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

function LevelZone({ lane, level, assignedSlugs, onDrop, onRemove }) {
  const [isOver, setIsOver] = useState(false);
  const isSuper = level === "super";
  const accent = isSuper ? SUPER_COMFORT_COLOR : COMFORT_COLOR;
  const heroes = [...assignedSlugs].map((slug) => HEROES.find((h) => h.slug === slug)).filter(Boolean);

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
        {heroes.map((hero) => {
          const offRole = !hero.roles.includes(lane);
          return (
            <div
              key={hero.slug}
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
              <button
                onClick={() => onRemove(lane, level, hero.slug)}
                className="shrink-0 text-gray-500 hover:text-red-400 transition-colors"
              >
                <XIcon size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LaneColumn({ lane, assignments, onDrop, onRemove }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[lane] }} />
        <span className="font-display font-bold text-sm tracking-wide" style={{ color: ROLE_COLOR[lane] }}>
          {lane.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <LevelZone lane={lane} level="super" assignedSlugs={assignments.super} onDrop={onDrop} onRemove={onRemove} />
        <LevelZone lane={lane} level="comfort" assignedSlugs={assignments.comfort} onDrop={onDrop} onRemove={onRemove} />
      </div>
    </div>
  );
}

export default function ComfortPicksPage() {
  const router = useRouter();
  const { comfortAssignments, assignComfort, removeComfort, totalAssignments } = useComfort();

  const pool = sortByTier(HEROES);

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
                Drag into Super Comfort or Comfort, any lane &mdash; {totalAssignments} assigned
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

          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {pool.map((hero) => (
              <DraggablePoolCard key={hero.slug} hero={hero} />
            ))}
          </div>
        </div>
      </div>

      {/* Lane columns, each split into Super Comfort / Comfort drop zones */}
      <div className="max-w-[1280px] mx-auto px-5 py-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ROLES.length}, 1fr)` }}>
          {ROLES.map((lane) => (
            <LaneColumn
              key={lane}
              lane={lane}
              assignments={comfortAssignments[lane]}
              onDrop={assignComfort}
              onRemove={removeComfort}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
