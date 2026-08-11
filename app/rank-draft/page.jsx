"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Undo2 } from "lucide-react";
import HeroGrid from "@/components/HeroGrid";
import TeamPanel from "@/components/TeamPanel";
import TurnIndicator from "@/components/TurnIndicator";
import {
  initialDraftState,
  applyAction,
  getStep,
  isHeroTaken,
  TOTAL_BANS,
  TOTAL_PICKS,
} from "@/lib/rankDraft";

export default function RankDraftPage() {
  const [state, setState] = useState(initialDraftState());
  const [history, setHistory] = useState([]); // stack of previous states, for undo
  const step = getStep(state.step);

  function handleSelect(hero) {
    if (step.phase === "complete") return;
    if (isHeroTaken(state, hero.slug)) return;
    setHistory((h) => [...h, state]);
    setState((s) => applyAction(s, hero.slug));
  }

  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function getStatus(hero) {
    if (state.bans.A.includes(hero.slug) || state.bans.B.includes(hero.slug)) return "banned";
    if (state.picks.A.includes(hero.slug) || state.picks.B.includes(hero.slug)) return "picked";
    return "available";
  }

  function reset() {
    setState(initialDraftState());
    setHistory([]);
  }

  return (
    <div className="min-h-screen" style={{ background: "#12141a", color: "#e8e6e1" }}>
      <div className="max-w-[1280px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={15} /> Mode select
          </Link>
          <h1 className="font-display font-bold text-2xl tracking-wide" style={{ color: "#f2efe9" }}>
            RANK DRAFT
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 font-display font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: history.length === 0 ? undefined : "#e8e6e1" }}
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        <TurnIndicator step={step} totalBans={TOTAL_BANS} totalPicks={TOTAL_PICKS} />

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-6 items-start">
          <TeamPanel side="A" name="TEAM A" bans={state.bans.A} picks={state.picks.A} activeStep={step} />
          <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.08)" }} />
          <TeamPanel side="B" name="TEAM B" bans={state.bans.B} picks={state.picks.B} activeStep={step} />
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <HeroGrid getStatus={getStatus} onSelect={handleSelect} disabled={step.phase === "complete"} />
        </div>
      </div>
    </div>
  );
}