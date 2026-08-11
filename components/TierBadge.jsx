"use client";

import { TIER_STYLE } from "@/lib/heroes";
import { Heart } from "lucide-react";

const COMFORT_COLOR = "#e879f9"; // Comfort - violet-pink
const SUPER_COMFORT_COLOR = "#ff2d95"; // Super Comfort - hot pink/magenta, brighter + glow

// comfortLevel: null | "comfort" | "super"
export default function TierBadge({ tier, size = "sm", comfortLevel = null }) {
  if (comfortLevel) {
    const isSuper = comfortLevel === "super";
    const color = isSuper ? SUPER_COMFORT_COLOR : COMFORT_COLOR;
    const iconSize = size === "sm" ? 10 : 13;
    return (
      <div className="flex items-center gap-1" style={isSuper ? { filter: `drop-shadow(0 0 4px ${color}99)` } : undefined}>
        <span className="font-display font-bold" style={{ color, fontSize: size === "sm" ? 13 : 16 }}>
          {isSuper ? "XX" : "X"}
        </span>
        <Heart size={iconSize} color={color} fill={isSuper ? color : "none"} strokeWidth={2} />
      </div>
    );
  }

  const t = TIER_STYLE[tier] || TIER_STYLE.C;
  const dims = size === "sm" ? { w: 6, h: 10 } : { w: 8, h: 13 };

  return (
    <div className="flex items-center gap-1">
      <span
        className="font-display font-bold"
        style={{ color: t.color, fontSize: size === "sm" ? 13 : 16 }}
      >
        {tier}
      </span>
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: dims.w,
              height: dims.h,
              clipPath: "polygon(0 0, 100% 50%, 0 100%)",
              background: i < t.chevrons ? t.color : "rgba(255,255,255,0.12)",
              boxShadow: i < t.chevrons ? `0 0 6px ${t.glow}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
