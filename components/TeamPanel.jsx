"use client";

import Image from "next/image";
import { heroBySlug, ROLE_COLOR } from "@/lib/heroes";
import { Ban } from "lucide-react";
import { compositionSummary, achievableTemplates, pickPrimaryTemplate, COMPOSITION_BUCKETS, humanizeBucket } from "@/lib/heroArchetypes";

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

const BUCKET_COLOR = {
  Tank: "#f87171",
  SemiTank: "#fb923c",
  SemiTankSupport: "#facc15",
  DamageLong: "#34d399",
  DamageShort: "#22d3ee",
};

// Live read on the team's composition against the four standard balance
// shapes (lib/heroArchetypes.js BALANCE_TEMPLATES) - one pill per bucket,
// filled count vs. what the current best-fit template calls for. Purely
// achievable-based (teamComp math only, no remaining-hero-pool check) -
// same simplification the scoring engine uses for its own template
// bonus/warning in lib/recommendation.js.
function CompositionTracker({ picks, side }) {
  const teamComp = compositionSummary(picks);
  if (teamComp.total === 0) return null;

  const achievable = achievableTemplates(teamComp);
  const primary = pickPrimaryTemplate(teamComp);
  const offTemplate = achievable.length === 0;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${side === "B" ? "flex-row-reverse" : ""}`}>
      {COMPOSITION_BUCKETS.map((bucket) => {
        const have = teamComp[bucket] || 0;
        const want = primary[bucket] || 0;
        const filled = have > 0;
        const color = BUCKET_COLOR[bucket];
        return (
          <div
            key={bucket}
            title={`${humanizeBucket(bucket)}: ${have}/${want || 0}`}
            className="flex items-center gap-1 rounded px-1.5 py-1"
            style={{
              background: filled ? `${color}22` : "transparent",
              border: `1px solid ${filled ? color + "77" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: filled ? color : "rgba(255,255,255,0.2)" }}
            />
            <span
              className="font-body font-semibold text-[9.5px] tabular-nums"
              style={{ color: filled ? color : "#6b7280" }}
            >
              {have}
              {want > 0 ? `/${want}` : ""}
            </span>
          </div>
        );
      })}
      <span
        className="font-body text-[9px] ml-1"
        style={{ color: offTemplate ? "#f87171" : "#6b7280" }}
        title={offTemplate ? "No standard balance shape currently fits this comp" : primary.label}
      >
        {offTemplate ? "off-template" : `${achievable.length}/4 shapes open`}
      </span>
    </div>
  );
}

// picks: [{slug, role}] for this team
// banCount / pickCount: total slots to render (defaults match Rank Draft:
// 3 bans, 5 picks - Tournament Draft passes banCount=4).
export default function TeamPanel({ side, name, bans, picks, activeStep, banCount = 3, pickCount = 5 }) {
  const accent = side === "A" ? "#3b82f6" : "#ef4444";

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 ${side === "B" ? "flex-row-reverse" : ""}`}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
        <span className="font-display font-bold text-lg tracking-wide" style={{ color: accent }}>
          {name}
        </span>
      </div>

      <div className={`flex gap-1.5 flex-wrap ${side === "B" ? "flex-row-reverse" : ""}`}>
        {Array.from({ length: banCount }).map((_, i) => (
          <BanSlot key={i} slug={bans[i]} />
        ))}
      </div>

      <div
        className="grid gap-1.5"
        style={{ direction: side === "B" ? "rtl" : "ltr", gridTemplateColumns: `repeat(${pickCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: pickCount }).map((_, i) => (
          <PickSlot
            key={i}
            pickEntry={picks[i]}
            side={side}
            active={activeStep.phase === "pick" && activeStep.team === side && picks.length === i}
          />
        ))}
      </div>

      <CompositionTracker picks={picks} side={side} />
    </div>
  );
}