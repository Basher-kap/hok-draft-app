"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Undo2, Sparkles, Heart } from "lucide-react";
import HeroGrid from "@/components/HeroGrid";
import TeamPanel from "@/components/TeamPanel";
import TurnIndicator from "@/components/TurnIndicator";
import { useComfort } from "@/components/ComfortProvider";
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
  const { isComfortHero, algorithmMode, setAlgorithmMode, totalAssignments } = useComfort();

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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
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

        <div
          className="flex items-center justify-between gap-3 flex-wrap mb-4 rounded-lg px-4 py-2.5"
          style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setAlgorithmMode(algorithmMode === "standard" ? "comfort" : "standard")}
            className="flex items-center gap-2.5"
            title="Switches how the AI recommendation engine will weigh suggestions (standard meta tier vs. leaning on your comfort picks)"
          >
            <Sparkles size={14} color={algorithmMode === "comfort" ? "#e879f9" : "#8a94a6"} />
            <span className="font-display font-semibold text-xs tracking-wide" style={{ color: "#8a94a6" }}>
              ALGORITHM
            </span>
            <div
              className="relative rounded-full transition-colors"
              style={{ width: 40, height: 20, background: algorithmMode === "comfort" ? "#e879f9" : "rgba(255,255,255,0.15)" }}
            >
              <div
                className="absolute rounded-full bg-white transition-transform"
                style={{
                  width: 16, height: 16, top: 2, left: 2,
                  transform: algorithmMode === "comfort" ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </div>
            <span
              className="font-display font-semibold text-xs tracking-wide"
              style={{ color: algorithmMode === "comfort" ? "#e879f9" : "#e8e6e1" }}
            >
              {algorithmMode === "comfort" ? "COMFORT-WEIGHTED" : "STANDARD"}
            </span>
          </button>

          <Link
            href="/comfort-picks"
            className="flex items-center gap-1.5 font-display font-bold text-xs tracking-wide rounded-md px-3.5 py-1.5 transition-all"
            style={{ background: "rgba(232,121,249,0.12)", color: "#e879f9", border: "1px solid rgba(232,121,249,0.35)" }}
          >
            <Heart size={13} fill="#e879f9" /> Comfort Heroes ({totalAssignments})
          </Link>
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
          <HeroGrid
            getStatus={getStatus}
            onSelect={handleSelect}
            disabled={step.phase === "complete"}
            isComfortHero={(hero) => isComfortHero(hero.slug)}
          />
        </div>
      </div>
    </div>
  );
}