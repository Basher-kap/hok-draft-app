"use client";

import Image from "next/image";
import { heroBySlug, ROLE_COLOR } from "@/lib/heroes";
import { Ban } from "lucide-react";

function BanSlot({ slug, isDuplicate }) {
  const hero = slug ? heroBySlug(slug) : null;
  return (
    <div
      className="relative w-11 h-11 rounded-md overflow-hidden shrink-0"
      style={{ background: "#0f1115", border: "1px solid rgba(239,68,68,0.35)" }}
      title={isDuplicate ? "Both sides banned this hero — a wasted ban on one side" : undefined}
    >
      {hero && (
        <>
          <Image src={hero.image} alt={hero.name} fill className="object-cover object-top grayscale" unoptimized />
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <Ban size={16} color="#ef4444" strokeWidth={2.5} />
          </div>
          {isDuplicate && (
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-0.5"
              style={{ background: "rgba(239,68,68,0.9)" }}
            >
              <span className="font-body font-bold" style={{ fontSize: 6, color: "#0f1115", letterSpacing: 0.3 }}>
                BOTH
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PickSlot({ pick, side, active }) {
  const hero = pick ? heroBySlug(pick.slug) : null;
  const role = pick?.role;
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
            <div className="flex gap-0.5 mt-0.5 flex-wrap">
              {/* Show the lane this hero was actually drafted to play, not
                  every lane it could theoretically fill (that list already
                  lives in the hero grid) — a flex hero occupies one lane. */}
              {role ? (
                <span
                  className="font-body font-semibold rounded"
                  style={{ fontSize: 7.5, color: "#0f1115", background: ROLE_COLOR[role], padding: "1px 3px" }}
                >
                  {role}
                </span>
              ) : (
                hero.roles.map((r) => (
                  <span
                    key={r}
                    className="font-body font-semibold rounded"
                    style={{ fontSize: 7.5, color: "#0f1115", background: ROLE_COLOR[r], padding: "1px 3px" }}
                  >
                    {r}
                  </span>
                ))
              )}
            </div>
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

export default function TeamPanel({ side, name, bans, otherBans = [], picks, activeStep }) {
  const accent = side === "A" ? "#3b82f6" : "#ef4444";
  const align = side === "A" ? "text-left" : "text-right";

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
          <BanSlot key={i} slug={bans[i]} isDuplicate={bans[i] ? otherBans.includes(bans[i]) : false} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5" style={{ direction: side === "B" ? "rtl" : "ltr" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <PickSlot
            key={i}
            pick={picks[i]}
            side={side}
            active={activeStep.phase === "pick" && activeStep.team === side && activeStep.index === i}
          />
        ))}
      </div>
    </div>
  );
}