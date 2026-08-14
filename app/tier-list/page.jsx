"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RotateCcw, ExternalLink, Sparkles } from "lucide-react";
import { ROLES, ROLE_COLOR, TIER_STYLE } from "@/lib/heroes";
import { TIERS, unrankedHeroesForRole } from "@/lib/tierList";
import { useTierList } from "@/components/TierListProvider";

// D isn't in the shared TIER_STYLE (draft board only ever shows S-C as a
// filter), so it gets its own look here - same visual language, one notch
// duller than C.
const ROW_STYLE = {
  ...TIER_STYLE,
  D: { color: "#c0392b", glow: "rgba(192,57,43,0.28)", chevrons: 0 },
};

const TIER_LABEL = {
  S: "OP",
  A: "META",
  B: "VIABLE",
  C: "OPTIONAL",
  D: "NOPE",
};

function HeroChip({ hero, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", hero.slug);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(hero.slug);
      }}
      className="flex items-center gap-1.5 rounded-md pl-1 pr-2 py-1 shrink-0"
      style={{ background: "#1a1e26", border: "1px solid rgba(255,255,255,0.08)", cursor: "grab" }}
      title={hero.name}
    >
      <div className="relative w-7 h-7 rounded overflow-hidden shrink-0 bg-[#0f1115]">
        <Image src={hero.image} alt={hero.name} fill className="object-cover object-top" unoptimized />
      </div>
      <span className="font-display font-semibold text-[11.5px] whitespace-nowrap" style={{ color: "#e8e6e1" }}>
        {hero.name}
      </span>
    </div>
  );
}

function TierRow({ tier, role, heroes, onDropHero }) {
  const [isOver, setIsOver] = useState(false);
  const style = ROW_STYLE[tier];

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
        if (slug) onDropHero(role, slug, tier);
      }}
      className="flex rounded-lg overflow-hidden transition-colors"
      style={{
        border: `1.5px solid ${isOver ? style.color : "rgba(255,255,255,0.07)"}`,
        background: isOver ? `${style.color}14` : "#161920",
      }}
    >
      <div
        className="flex flex-col items-center justify-center gap-0.5 shrink-0"
        style={{ width: 64, background: `${style.color}18`, borderRight: `1.5px solid ${style.color}40` }}
      >
        <span className="font-display font-bold text-xl" style={{ color: style.color }}>
          {tier}
        </span>
        <span className="font-body font-semibold text-[8.5px] tracking-wide" style={{ color: style.color }}>
          {TIER_LABEL[tier]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2 flex-1" style={{ minHeight: 56 }}>
        {heroes.length === 0 && (
          <span className="font-body text-[11px] text-gray-600 self-center px-1">Drop heroes here</span>
        )}
        {heroes.map((hero) => (
          <HeroChip key={hero.slug} hero={hero} />
        ))}
      </div>
    </div>
  );
}

export default function TierListPage() {
  const { assignments, moveHero, resetRole, resetAll, isCustomized, anyCustomized, effectiveHeroes } = useTierList();
  const [activeRole, setActiveRole] = useState(ROLES[0]);

  const heroBySlug = (slug) => effectiveHeroes.find((h) => h.slug === slug);
  const heroesForTier = (role, tier) =>
    (assignments[role]?.[tier] || []).map(heroBySlug).filter(Boolean);
  const unranked = unrankedHeroesForRole(assignments, activeRole, effectiveHeroes);

  return (
    <div className="min-h-screen" style={{ background: "#12141a", color: "#e8e6e1" }}>
      <div className="max-w-[1000px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <Link
            href="/rank-draft"
            className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={15} /> Back to draft
          </Link>
          <h1 className="font-display font-bold text-2xl tracking-wide" style={{ color: "#f2efe9" }}>
            TIER LIST
          </h1>
          <button
            onClick={resetAll}
            disabled={!anyCustomized}
            className="flex items-center gap-1.5 font-display font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: "#e8e6e1" }}
          >
            <RotateCcw size={14} /> Reset all
          </button>
        </div>

        <p className="font-body text-[12.5px] text-gray-500 text-center mb-5">
          Drag heroes between tiers to build your own list, per lane. Your list drives the AI suggestions on the
          draft board &mdash; not just the badges.
        </p>

        <div
          className="flex items-center gap-2 mb-4 p-2.5 rounded-lg flex-wrap"
          style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Sparkles size={13} color="#f5c451" className="shrink-0 ml-0.5" />
          <span className="font-body text-[11.5px] text-gray-500">
            This starts as a sample list (community/hokstats.gg-style ratings, split per lane). Drag anything to make
            it yours &mdash; it's saved on this device.
          </span>
          <a
            href="https://hokstats.gg/tier-list/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 font-display font-semibold text-[11px] text-gray-500 hover:text-gray-300 transition-colors shrink-0"
          >
            hokstats.gg <ExternalLink size={11} />
          </a>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-4">
          {ROLES.map((r) => {
            const isActive = activeRole === r;
            return (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className="font-display font-semibold rounded px-3.5 py-1.5 text-[13px] tracking-wide transition-all flex items-center gap-1.5"
                style={{
                  border: `1px solid ${isActive ? ROLE_COLOR[r] : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? `${ROLE_COLOR[r]}22` : "transparent",
                  color: isActive ? ROLE_COLOR[r] : "#8a94a6",
                }}
              >
                {r}
                {isCustomized(r) && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLOR[r] }} title="Customized" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-bold text-sm tracking-wide" style={{ color: ROLE_COLOR[activeRole] }}>
            {activeRole.toUpperCase()}
          </span>
          <button
            onClick={() => resetRole(activeRole)}
            disabled={!isCustomized(activeRole)}
            className="flex items-center gap-1.5 font-display font-semibold text-xs text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} /> Reset {activeRole} to sample
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {TIERS.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              role={activeRole}
              heroes={heroesForTier(activeRole, tier)}
              onDropHero={moveHero}
            />
          ))}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const slug = e.dataTransfer.getData("text/plain");
            if (slug) moveHero(activeRole, slug, "unranked");
          }}
          className="rounded-lg p-2.5"
          style={{ border: "1.5px dashed rgba(255,255,255,0.12)", background: "#12141a" }}
        >
          <div className="font-display font-semibold text-[11px] tracking-wide text-gray-500 mb-1.5 px-0.5">
            UNRANKED &middot; drag here to pull a hero out of the list
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unranked.length === 0 && (
              <span className="font-body text-[11px] text-gray-600 px-1 py-1">Every {activeRole} hero is sorted.</span>
            )}
            {unranked.map((hero) => (
              <HeroChip key={hero.slug} hero={hero} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
