"use client";

import Image from "next/image";
import { heroBySlug, ROLE_COLOR } from "@/lib/heroes";
import { compositionSummary, ACTIVE_BALANCE_TEMPLATES, COMPOSITION_BUCKETS, humanizeBucket } from "@/lib/heroArchetypes";
import { Ban, Check } from "lucide-react";

function BanSlot({ slug }) {
  const hero = slug ? heroBySlug(slug) : null;
  return (
    <div
      className="relative w-11 h-11 rounded-md overflow-hidden shrink-0"
      style={{ background: "#0f1115", border: "1px solid rgba(239,68,68,0.35)" }}
    >
      {hero && (
        <>
          <Image src={hero.image} alt={hero.name} fill className="object-cover object-top grayscale" unoptimized />
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <Ban size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
        </>
      )}
    </div>
  );
}

// pickEntry: { slug, role } | undefined - role is the lane THIS pick was
// drafted for (chosen at pick time for flex heroes), not the hero's full
// role list.
function PickSlot({ pickEntry, side, active }) {
  const hero = pickEntry ? heroBySlug(pickEntry.slug) : null;
  const role = pickEntry?.role;
  const accent = side === "A" ? "#3b82f6" : "#ef4444";

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        aspectRatio: "3/4",
        background: "#0f1115",
        border: `1.5px solid ${hero ? accent + "88" : active ? accent : "rgba(255,255,255,0.08)"}`,
        boxShadow: active ? `0 0 14px ${accent}55` : "none",
      }}
    >
      {hero ? (
        <>
          <Image src={hero.image} alt={hero.name} fill className="object-cover object-top" unoptimized />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(15,17,21,0) 55%, rgba(15,17,21,0.95) 100%)" }}
          />
          <div className="absolute bottom-1 left-1.5 right-1.5">
            <div className="font-display font-semibold text-[11px] leading-tight truncate" style={{ color: "#f2efe9" }}>
              {hero.name}
            </div>
            {role && (
              <span
                className="font-body font-semibold rounded inline-block mt-0.5"
                style={{ fontSize: 7.5, color: "#0f1115", background: ROLE_COLOR[role], padding: "1px 3px" }}
              >
                {role}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {active && (
            <span className="font-display text-[10px] font-semibold tracking-wide animate-pulse" style={{ color: accent }}>
              PICKING
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Live status bar for the fixed target comp (see ACTIVE_BALANCE_TEMPLATES
// in lib/heroArchetypes.js - currently "2 Tank / 2 Damage(L+S) / 1
// Semi-Tank"). Shows what this team still needs per bucket, ticking down
// to 0 as picks are drafted - e.g. starts at Tank:2, drops to Tank:1 once
// a Heavy is picked, then to Tank:0 (checked off) on the second one. Only
// buckets the active target actually calls for (>0) are shown, so this
// adapts automatically if the target template is ever changed.
function CompositionTracker({ picks, accent }) {
  const target = ACTIVE_BALANCE_TEMPLATES[0];
  const current = compositionSummary(picks);
  const buckets = COMPOSITION_BUCKETS.filter((b) => target[b] > 0);
  if (buckets.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-body font-semibold text-[9px] tracking-wide text-gray-600 uppercase shrink-0">
        Target
      </span>
      {buckets.map((b) => {
        const remaining = Math.max(target[b] - current[b], 0);
        const over = current[b] > target[b];
        const done = remaining === 0 && !over;
        return (
          <span
            key={b}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-display font-semibold text-[10px] whitespace-nowrap"
            style={{
              background: done ? "rgba(255,255,255,0.04)" : over ? "rgba(245,158,11,0.1)" : `${accent}18`,
              border: `1px solid ${over ? "#f59e0b70" : done ? "rgba(255,255,255,0.08)" : accent + "55"}`,
              color: over ? "#f59e0b" : done ? "#5b6270" : accent,
            }}
            title={over ? `${humanizeBucket(b)}: drafted ${current[b]}, target was ${target[b]}` : undefined}
          >
            {done && <Check size={9} strokeWidth={3} />}
            {humanizeBucket(b)}: {remaining}
          </span>
        );
      })}
    </div>
  );
}

// picks: [{slug, role}] for this team
export default function TeamPanel({ side, name, bans, picks, activeStep }) {
  const accent = side === "A" ? "#3b82f6" : "#ef4444";

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 ${side === "B" ? "flex-row-reverse" : ""}`}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
        <span className="font-display font-bold text-lg tracking-wide" style={{ color: accent }}>
          {name}
        </span>
      </div>

      <div className={`flex gap-1.5 ${side === "B" ? "flex-row-reverse" : ""}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <BanSlot key={i} slug={bans[i]} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5" style={{ direction: side === "B" ? "rtl" : "ltr" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <PickSlot
            key={i}
            pickEntry={picks[i]}
            side={side}
            active={activeStep.phase === "pick" && activeStep.team === side && activeStep.index === i}
          />
        ))}
      </div>

      <div className={`flex ${side === "B" ? "justify-end" : "justify-start"}`}>
        <CompositionTracker picks={picks} accent={accent} />
      </div>
    </div>
  );
}