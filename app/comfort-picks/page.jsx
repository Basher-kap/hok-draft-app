"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X as XIcon, ArrowLeft, GripVertical } from "lucide-react";
import { HEROES, ROLES, ROLE_COLOR, sortByTier } from "@/lib/heroes";
import { useComfort } from "@/components/ComfortProvider";

function PoolCard({ hero, dragged }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", hero.slug);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="relative flex flex-col items-center shrink-0 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        width: 68,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#1a1e26",
        opacity: dragged === hero.slug ? 0.4 : 1,
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        <Image src={hero.image} alt={hero.name} fill className="object-cover object-top pointer-events-none" unoptimized />
        <div className="absolute top-0.5 left-0.5 opacity-60">
          <GripVertical size={11} color="#e8e6e1" />
        </div>
      </div>
      <div
        className="w-full text-center font-display font-semibold py-1 truncate px-1"
        style={{ fontSize: 9.5, color: "#c9c7c2" }}
      >
        {hero.name}
      </div>
    </div>
  );
}

function LaneDropZone({ lane, assignedSlugs, onDrop, onRemove }) {
  const [isOver, setIsOver] = useState(false);
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
        if (slug) onDrop(lane, slug);
      }}
      className="flex flex-col rounded-lg min-h-[220px] transition-colors"
      style={{
        border: `2px dashed ${isOver ? ROLE_COLOR[lane] : "rgba(255,255,255,0.1)"}`,
        background: isOver ? `${ROLE_COLOR[lane]}14` : "#161920",
      }}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[lane] }} />
        <span className="font-display font-bold text-sm tracking-wide" style={{ color: ROLE_COLOR[lane] }}>
          {lane.toUpperCase()}
        </span>
        <span className="font-body text-[11px] text-gray-500 ml-auto">{heroes.length}</span>
      </div>

      <div className="flex flex-col gap-1.5 px-2.5 pb-3 flex-1">
        {heroes.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center px-2">
            <span className="font-body text-[11px] text-gray-600">Drag heroes here</span>
          </div>
        )}
        {heroes.map((hero) => {
          const offRole = !hero.roles.includes(lane);
          return (
            <div
              key={hero.slug}
              className="flex items-center gap-2 rounded-md px-2 py-1.5"
              style={{ background: "#1a1e26", border: `1px solid ${ROLE_COLOR[lane]}33` }}
            >
              <div className="relative w-6 h-8 rounded overflow-hidden shrink-0">
                <Image src={hero.image} alt={hero.name} fill className="object-cover object-top" unoptimized />
              </div>
              <span className="font-display font-semibold text-xs flex-1 truncate" style={{ color: "#e8e6e1" }}>
                {hero.name}
              </span>
              {offRole && (
                <span
                  className="font-body text-[8.5px] font-semibold rounded px-1 py-0.5 shrink-0"
                  style={{ color: "#12141a", background: "#e879f9" }}
                  title={`Off-role: ${hero.name}'s listed lane(s) are ${hero.roles.join(", ")}`}
                >
                  OFF-ROLE
                </span>
              )}
              <button
                onClick={() => onRemove(lane, hero.slug)}
                className="shrink-0 text-gray-500 hover:text-red-400 transition-colors"
              >
                <XIcon size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComfortPicksPage() {
  const router = useRouter();
  const { comfortAssignments, assignComfort, removeComfort, totalAssignments } = useComfort();
  const [dragged, setDragged] = useState(null);

  const pool = sortByTier(HEROES);

  return (
    <div className="min-h-screen" style={{ background: "#12141a", color: "#e8e6e1" }}>
      {/* Sticky header + hero pool - stays visible while lane containers below scroll */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-4"
        style={{ background: "#12141a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-[1200px] mx-auto">
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
                Drag a hero into any lane below &mdash; even off their usual role &mdash; {totalAssignments} assigned
              </p>
            </div>
            <button
              onClick={() => router.push("/rank-draft")}
              className="font-display font-bold text-sm tracking-wide rounded-md px-5 py-2 transition-all"
              style={{ background: "#e879f9", color: "#12141a" }}
            >
              Done
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {pool.map((hero) => (
              <div key={hero.slug} onDragEnd={() => setDragged(null)} onDragStart={() => setDragged(hero.slug)}>
                <PoolCard hero={hero} dragged={dragged} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lane drop zones */}
      <div className="max-w-[1200px] mx-auto px-5 py-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ROLES.length}, 1fr)` }}>
          {ROLES.map((lane) => (
            <LaneDropZone
              key={lane}
              lane={lane}
              assignedSlugs={comfortAssignments[lane]}
              onDrop={assignComfort}
              onRemove={removeComfort}
            />
          ))}
        </div>
      </div>
    </div>
  );
}