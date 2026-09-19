"use client";

import Image from "next/image";
import { heroBySlug, ROLE_COLOR } from "@/lib/heroes";
import { Ban } from "lucide-react";
import { compositionSummary, achievableTemplates, pickPrimaryTemplate, COMPOSITION_BUCKETS, humanizeBucket, BALANCE_TEMPLATES } from "@/lib/heroArchetypes";

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

const BUCKET_SHORT_LABEL = {
  Tank: "Tank",
  SemiTank: "Semi-Tank",
  SemiTankSupport: "Semi-Tank Sup.",
  DamageLong: "Dmg (L)",
  DamageShort: "Dmg (S)",
};

// Exact wording Basher uses for each of the four standard balance shapes
// (lib/heroArchetypes.js BALANCE_TEMPLATES), keyed by the template's own
// unique `label` so this can never point at the wrong shape even if the
// templates array gets reordered.
const TEMPLATE_DISPLAY_LABEL = {
  "2 Tank / 2 Damage (L+S) / 1 Semi-Tank": "2 Tanks, 2 Damage (Long and Short), 1 Semi-Tank",
  "2 Semi-Tank / 2 Damage (L+S) / 1 Semi-Tank Support": "2 Semi-Tanks, 2 Damage (Long and Short), 1 Semi-Tank Support",
  "3 Damage (2S+1L) / 1 Tank / 1 Semi-Tank": "3 Damage (2 Short and 1 Long), 1 Tank, 1 Semi-Tank",
  "3 Damage (2S+1L) / 2 Tank": "3 Damage (2 Short and 1 Long), 2 Tank",
};
function templateDisplayLabel(t) {
  return TEMPLATE_DISPLAY_LABEL[t.label] || t.label;
}

// Below the pick grid: which of the four standard balance shapes this
// team is building toward, PLUS a running tally of how many heroes of
// each archetype bucket have actually been picked - so it's both "what
// shape are we aiming for" and "what have we actually drafted so far".
// Purely achievable-based (teamComp math only, no remaining-hero-pool
// check) - same simplification the scoring engine's own template
// bonus/warning uses in lib/recommendation.js.
function LineupBalancePanel({ picks, side }) {
  const teamComp = compositionSummary(picks);
  const achievable = achievableTemplates(teamComp);
  const achievableLabels = new Set(achievable.map((t) => t.label));
  const primary = pickPrimaryTemplate(teamComp);

  return (
    <div className="flex flex-col gap-2 rounded-lg px-3 py-2.5" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className={`flex items-center justify-between gap-2 ${side === "B" ? "flex-row-reverse" : ""}`}>
        <span className="font-display font-bold text-[10px] tracking-wide" style={{ color: "#8a94a6" }}>
          LINEUP BALANCE
        </span>
        {/* Archetype tally - how many heroes of each bucket are actually
            picked so far, regardless of which template ends up used. */}
        <div className={`flex items-center gap-2 ${side === "B" ? "flex-row-reverse" : ""}`}>
          {COMPOSITION_BUCKETS.map((bucket) => (
            <span
              key={bucket}
              title={humanizeBucket(bucket)}
              className="font-body font-semibold text-[9.5px] tabular-nums"
              style={{ color: teamComp[bucket] > 0 ? BUCKET_COLOR[bucket] : "#4b5563" }}
            >
              {BUCKET_SHORT_LABEL[bucket]} {teamComp[bucket] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {BALANCE_TEMPLATES.map((t) => {
          const isAchievable = achievableLabels.has(t.label);
          const isPrimary = isAchievable && t.label === primary.label;
          return (
            <div
              key={t.label}
              className={`flex items-center gap-2.5 rounded px-2 py-1.5 ${side === "B" ? "flex-row-reverse text-right" : ""}`}
              style={{
                opacity: isAchievable ? 1 : 0.4,
                background: isPrimary ? "rgba(245,196,81,0.1)" : "transparent",
                border: `1px solid ${isPrimary ? "rgba(245,196,81,0.4)" : "transparent"}`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isAchievable ? (isPrimary ? "#f5c451" : "#8a94a6") : "#ef4444" }}
              />
              <span
                className="font-body text-[11px] flex-1"
                style={{
                  color: isPrimary ? "#f5c451" : isAchievable ? "#e8e6e1" : "#6b7280",
                  textDecoration: isAchievable ? "none" : "line-through",
                }}
              >
                {templateDisplayLabel(t)}
              </span>
              {/* Per-bucket have/need for this specific shape, so it's
                  visible exactly what's still missing to complete it. */}
              <div className="flex items-center gap-1.5 shrink-0">
                {COMPOSITION_BUCKETS.filter((b) => t[b] > 0).map((b) => (
                  <span
                    key={b}
                    className="font-body text-[9px] tabular-nums"
                    style={{ color: (teamComp[b] || 0) >= t[b] ? BUCKET_COLOR[b] : "#6b7280" }}
                  >
                    {teamComp[b] || 0}/{t[b]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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

      <LineupBalancePanel picks={picks} side={side} />
    </div>
  );
}