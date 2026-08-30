"use client";

import Image from "next/image";
import { Sparkles, TriangleAlert } from "lucide-react";

const WARNING_COLOR = "#f59e0b";

// Ranked list, highest priority first (index 0 = top suggestion to ban/pick).
// Caller should already cap this at 10 (see topN in getSuggestions), this
// slice is just a safety net.
//
// Each reason is { text, type: "info" | "positive" | "warning" } (see
// lib/recommendation.js). A hero can still rank near the top overall while
// carrying a warning - e.g. it fills a gap and counters something, but is
// ALSO countered by something the enemy already picked - so warnings are
// surfaced visibly (amber badge + amber text) rather than only implied by
// a slightly lower score.
export default function AISuggestPanel({ suggestions, phase, onSelect, disabled }) {
  if (!suggestions || suggestions.length === 0) return null;
  const shown = suggestions.slice(0, 10);

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
          top {shown.length} &mdash; #1 = highest priority
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
        {shown.map(({ hero, reasons }, i) => {
          const hasWarning = reasons.some((r) => r.type === "warning");
          return (
            <button
              key={hero.slug}
              onClick={() => !disabled && onSelect(hero)}
              disabled={disabled}
              className="flex items-start gap-2 rounded-md pl-1.5 pr-2.5 py-1.5 shrink-0 transition-all text-left"
              style={{
                background: "#1a1e26",
                border: `1px solid ${hasWarning ? WARNING_COLOR + "70" : i === 0 ? accent + "88" : "rgba(255,255,255,0.08)"}`,
                cursor: disabled ? "default" : "pointer",
                width: 192,
                alignSelf: "flex-start",
              }}
            >
              <span
                className="font-display font-bold text-[11px] w-4 text-center shrink-0 pt-0.5"
                style={{ color: i === 0 ? accent : "#6b7280" }}
              >
                {i + 1}
              </span>
              <div className="relative w-7 h-9 rounded overflow-hidden shrink-0 bg-[#0f1115]">
                <Image src={hero.image} alt={hero.name} fill className="object-cover" unoptimized />
                {hasWarning && (
                  <div
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                    style={{ width: 14, height: 14, background: WARNING_COLOR, boxShadow: "0 0 4px rgba(0,0,0,0.6)" }}
                    title="This hero has a counter risk in the current draft"
                  >
                    <TriangleAlert size={9} color="#12141a" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-display font-semibold text-xs truncate w-full" style={{ color: "#f2efe9" }}>
                  {hero.name}
                </span>
                <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                  {reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="font-body text-[10px] leading-tight flex items-start gap-0.5"
                      style={{ color: reason.type === "warning" ? WARNING_COLOR : "#8a94a6" }}
                    >
                      {reason.type === "warning" && (
                        <TriangleAlert size={9} className="shrink-0 mt-0.5" color={WARNING_COLOR} />
                      )}
                      <span>{reason.text}</span>
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}