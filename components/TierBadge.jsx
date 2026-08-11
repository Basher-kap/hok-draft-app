"use client";

import { TIER_STYLE } from "@/lib/heroes";

export default function TierBadge({ tier, size = "sm" }) {
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
