"use client";

import { SIDE_META, pickContext } from "@/lib/rankDraft";

export default function TurnIndicator({ step, totalBans, totalPicks }) {
  if (step.phase === "complete") {
    return (
      <div className="text-center py-2">
        <span className="font-display font-bold text-xl tracking-wide" style={{ color: "#f5c451" }}>
          DRAFT COMPLETE
        </span>
      </div>
    );
  }

  const side = SIDE_META[step.team];
  const accent = side.color;
  const label = step.phase === "ban" ? "BAN PHASE" : "PICK PHASE";
  const progress =
    step.phase === "ban" ? `${step.index + 1} / ${totalBans}` : `${step.index + 1} / ${totalPicks}`;

  // Only the draft's very first pick is truly blind - every later pick
  // already has at least one enemy hero on the board.
  const context = step.phase === "pick" ? pickContext(step.index) : null;
  const contextLabel = context === "blind" ? "Blind Pick" : context === "reactive" ? "Reads the board" : null;

  return (
    <div className="flex items-center justify-center gap-3 py-2 flex-wrap">
      <span
        className="font-display font-bold text-sm tracking-widest px-2.5 py-1 rounded"
        style={{ color: step.phase === "ban" ? "#ef4444" : "#f5c451", border: `1px solid ${step.phase === "ban" ? "#ef4444" : "#f5c451"}55` }}
      >
        {label}
      </span>
      <span className="font-display font-semibold text-base" style={{ color: accent }}>
        {side.label} ({side.tag}) &mdash; Team {step.team}&rsquo;s turn
      </span>
      <span className="font-body text-xs text-gray-500">{progress}</span>
      {contextLabel && (
        <span
          className="font-body font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-full"
          style={{ color: "#8a94a6", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {contextLabel}
        </span>
      )}
    </div>
  );
}