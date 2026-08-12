"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

// Ranked list, highest priority first (index 0 = top suggestion to ban/pick).
export default function AISuggestPanel({ suggestions, phase, onSelect, disabled }) {
  if (!suggestions || suggestions.length === 0) return null;

  const accent = phase === "ban" ? "#ef4444" : "#f5c451";

  return (
    <div
      className="rounded-lg p-3 mb-3"
      style={{ background: "#161920", border: `1px solid ${accent}33` }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={14} color={accent} />
        <span className="font-display font-bold text-xs tracking-wide" style={{ color: accent }}>
           {phase === "ban" ? "BANNING" : "PICKING"}
        </span>
        <span className="font-body text-[11px] text-gray-500">
          {suggestions.length} ranked &mdash; #1 = highest priority
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
        {suggestions.map(({ hero, reasons }, i) => (
          <button
            key={hero.slug}
            onClick={() => !disabled && onSelect(hero)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-md pl-1.5 pr-3 py-1.5 shrink-0 transition-all"
            style={{
              background: "#1a1e26",
              border: `1px solid ${i === 0 ? accent + "88" : "rgba(255,255,255,0.08)"}`,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            <span
              className="font-display font-bold text-[11px] w-5 text-center shrink-0"
              style={{ color: i === 0 ? accent : "#6b7280" }}
            >
              {i + 1}
            </span>
            <div className="relative w-7 h-9 rounded overflow-hidden shrink-0 bg-[#0f1115]">
              <Image src={hero.image} alt={hero.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-col items-start whitespace-nowrap">
              <span className="font-display font-semibold text-xs" style={{ color: "#f2efe9" }}>
                {hero.name}
              </span>
              <span className="font-body text-[10px] text-gray-500">{reasons.join(" · ")}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}