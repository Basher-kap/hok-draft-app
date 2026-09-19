"use client";

// completeLabel / phaseLabel let callers (e.g. Tournament Draft, which has
// two ban+pick sub-phases per game) override the default text without
// touching Rank Draft's plain "BAN PHASE" / "PICK PHASE" behavior.
export default function TurnIndicator({ step, totalBans, totalPicks, completeLabel = "DRAFT COMPLETE", phaseLabel }) {
  if (step.phase === "complete") {
    return (
      <div className="text-center py-2">
        <span className="font-display font-bold text-xl tracking-wide" style={{ color: "#f5c451" }}>
          {completeLabel}
        </span>
      </div>
    );
  }

  const accent = step.team === "A" ? "#3b82f6" : "#ef4444";
  const label = phaseLabel || (step.phase === "ban" ? "BAN PHASE" : "PICK PHASE");
  const progress =
    step.phase === "ban" ? `${step.index + 1} / ${totalBans}` : `${step.index + 1} / ${totalPicks}`;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <span
        className="font-display font-bold text-sm tracking-widest px-2.5 py-1 rounded"
        style={{ color: step.phase === "ban" ? "#ef4444" : "#f5c451", border: `1px solid ${step.phase === "ban" ? "#ef4444" : "#f5c451"}55` }}
      >
        {label}
      </span>
      <span className="font-display font-semibold text-base" style={{ color: accent }}>
        Team {step.team}&rsquo;s turn
      </span>
      <span className="font-body text-xs text-gray-500">{progress}</span>
    </div>
  );
}