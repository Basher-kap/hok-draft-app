"use client";

import Image from "next/image";
import { ROLE_COLOR, TIER_STYLE } from "@/lib/heroes";
import TierBadge from "./TierBadge";
import { Ban, Lock } from "lucide-react";

const COMFORT_COLOR = "#e879f9";
const SUPER_COMFORT_COLOR = "#ff2d95";

// status: "available" | "banned" | "picked" | undefined(available)
// comfortLevel: null | "comfort" | "super"
export default function HeroCard({ hero, status, onClick, disabled, comfortLevel = null }) {
  const t = TIER_STYLE[hero.tier] || TIER_STYLE.C;
  const isTaken = status === "banned" || status === "picked";
  const accentColor = comfortLevel === "super" ? SUPER_COMFORT_COLOR : comfortLevel === "comfort" ? COMFORT_COLOR : t.color;

  return (
    <button
      onClick={() => !isTaken && !disabled && onClick?.(hero)}
      disabled={isTaken || disabled}
      className="relative flex flex-col rounded-lg overflow-hidden border text-left transition-all duration-150 w-full"
      style={{
        background: "#1a1e26",
        borderColor: comfortLevel ? accentColor + "40" : "rgba(255,255,255,0.06)",
        cursor: isTaken || disabled ? "default" : "pointer",
        opacity: isTaken ? 0.35 : 1,
      }}
      onMouseEnter={(e) => {
        if (isTaken || disabled) return;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = comfortLevel ? accentColor + "40" : "rgba(255,255,255,0.06)";
      }}
    >
      <div className="relative w-full aspect-square bg-[#0f1115] overflow-hidden">
        <Image
          src={hero.image}
          alt={hero.name}
          fill
          sizes="100px"
          className="object-cover p-1"
          unoptimized
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,17,21,0) 55%, rgba(15,17,21,0.92) 100%)",
          }}
        />

        {status === "banned" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Ban size={30} color="#ef4444" strokeWidth={2.5} />
          </div>
        )}
        {status === "picked" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Lock size={26} color="#8a94a6" strokeWidth={2.5} />
          </div>
        )}

        <div
          className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded px-1.5 py-0.5"
          style={{
            background: "rgba(10,11,14,0.72)",
            border: `1px solid ${accentColor}55`,
          }}
        >
          <TierBadge tier={hero.tier} size="sm" comfortLevel={comfortLevel} />
        </div>

        {hero.intl_exclusive && (
          <div
            className="absolute top-1.5 right-1.5 font-display font-bold rounded px-1 py-0.5"
            style={{
              fontSize: 10,
              letterSpacing: 0.6,
              color: "#0f1115",
              background: "#e8e2d6",
            }}
          >
            INTL
          </div>
        )}

        <div className="absolute bottom-1.5 left-2 right-2">
          <div
            className="font-display font-semibold leading-tight"
            style={{ fontSize: 14, color: "#f2efe9", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {hero.name}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {hero.roles.map((r) => (
              <span
                key={r}
                className="font-body font-semibold rounded"
                style={{
                  fontSize: 8.5,
                  color: "#0f1115",
                  background: ROLE_COLOR[r],
                  padding: "1.5px 4px",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
