"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Undo2, Sparkles, Heart, ListTree, ChevronRight, Lock, Trophy } from "lucide-react";
import HeroGrid from "@/components/HeroGrid";
import TeamPanel from "@/components/TeamPanel";
import TurnIndicator from "@/components/TurnIndicator";
import AISuggestPanel from "@/components/AISuggestPanel";
import RoleSelectModal from "@/components/RoleSelectModal";
import { useComfort } from "@/components/ComfortProvider";
import { useTierList } from "@/components/TierListProvider";
import { getSuggestions } from "@/lib/recommendation";
import { heroBySlug } from "@/lib/heroes";
import {
  initialSeriesState,
  applyAction,
  advanceToNextGame,
  getStep,
  isSelectable,
  isHeroBannedByAnyoneThisGame,
  isHeroPickedThisGame,
  isHeroLockedForTeam,
  isGameDraftComplete,
  isSeriesComplete,
  canAdvanceGame,
  TOTAL_BANS,
  TOTAL_PICKS,
  BANS_PER_SIDE,
  PICKS_PER_SIDE,
  MATCH_LENGTHS,
} from "@/lib/tournamentDraft";

// ---- Setup screen: choose Bo3 / Bo5 / Bo7 before the series starts ----
function SeriesSetup({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "#12141a", color: "#e8e6e1" }}>
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200">
        <ArrowLeft size={15} /> Mode select
      </Link>
      <Trophy size={30} color="#f5c451" className="mb-3" />
      <h1 className="font-display font-bold text-2xl tracking-wide mb-2" style={{ color: "#f2efe9" }}>
        TOURNAMENT DRAFT
      </h1>
      <p className="font-body text-sm text-gray-500 max-w-md text-center mb-7">
        Global ban &amp; pick. Bans reset every game; once a team picks a hero, that team can&rsquo;t
        pick it again for the rest of the series &mdash; the opposing side still can.
      </p>
      <div className="flex flex-col items-center gap-2 mb-2">
        <span className="font-display font-semibold text-xs tracking-widest text-gray-500">SELECT MATCH LENGTH</span>
        <div className="flex gap-3">
          {MATCH_LENGTHS.map((n) => (
            <button
              key={n}
              onClick={() => onStart(n)}
              className="font-display font-bold text-lg rounded-lg px-6 py-3.5 transition-all"
              style={{ background: "#1a1e26", border: "1px solid rgba(245,196,81,0.35)", color: "#f5c451" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,196,81,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1e26")}
            >
              Best of {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Compact strip of heroes a team has locked in (picked in an earlier
// game of the series) - they can't pick these again, enemy still can. ----
function LockedStrip({ side, slugs }) {
  if (!slugs || slugs.length === 0) return null;
  const accent = side === "A" ? "#3b82f6" : "#ef4444";
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${side === "B" ? "flex-row-reverse" : ""}`}>
      <span className="flex items-center gap-1 font-display font-semibold text-[10px] tracking-wide text-gray-500 shrink-0">
        <Lock size={10} /> LOCKED
      </span>
      {slugs.map((slug, i) => {
        const hero = heroBySlug(slug);
        if (!hero) return null;
        return (
          <div
            key={slug + i}
            className="relative w-6 h-6 rounded overflow-hidden shrink-0"
            style={{ border: `1px solid ${accent}88` }}
            title={`${hero.name} - already picked by this team, series-locked`}
          >
            <Image src={hero.image} alt={hero.name} fill className="object-cover object-top grayscale" unoptimized />
          </div>
        );
      })}
    </div>
  );
}

export default function TournamentDraftPage() {
  const [seriesState, setSeriesState] = useState(null); // null = setup screen not yet started
  const [history, setHistory] = useState([]); // stack of previous seriesState snapshots, for undo
  const [pendingHero, setPendingHero] = useState(null); // flex hero awaiting a role choice (pick phase)
  const { isComfortHero, algorithmMode, setAlgorithmMode, totalAssignments } = useComfort();
  const { effectiveHeroesFor } = useTierList();
  const effectiveHeroes = effectiveHeroesFor("tournament");

  if (!seriesState) {
    return <SeriesSetup onStart={(n) => setSeriesState(initialSeriesState(n))} />;
  }

  const step = getStep(seriesState.current.step);
  const gameComplete = isGameDraftComplete(seriesState.current);
  const seriesComplete = isSeriesComplete(seriesState);
  const canNextGame = canAdvanceGame(seriesState);

  function pushHistory() {
    setHistory((h) => [...h, seriesState]);
  }

  function commit(hero, role) {
    pushHistory();
    setSeriesState((s) => applyAction(s, hero.slug, role));
  }

  function handleSelect(hero) {
    if (gameComplete) return;
    if (!isSelectable(seriesState, step, hero.slug)) return;

    if (step.phase === "pick" && hero.roles.length > 1) {
      setPendingHero(hero);
      return;
    }
    commit(hero, step.phase === "pick" ? hero.roles[0] : null);
  }

  function handleRoleChosen(role) {
    if (!pendingHero) return;
    commit(pendingHero, role);
    setPendingHero(null);
  }

  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setSeriesState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function handleNextGame() {
    if (!canNextGame) return;
    pushHistory();
    setSeriesState((s) => advanceToNextGame(s));
  }

  function resetSeries() {
    setSeriesState(null);
    setHistory([]);
    setPendingHero(null);
  }

  // Ban phase: blocked if EITHER side has already banned this hero this
  // game - unlike Rank Draft, there are no duplicate bans across sides,
  // it's a single shared ban pool for the game (still resets every game).
  // Pick phase: banned/picked-by-anyone-this-game applies, plus the
  // acting team's own series-wide pick lock (shown the same way as an
  // ordinary "picked" hero - unavailable, with a lock icon).
  function getStatus(hero) {
    const current = seriesState.current;
    if (step.phase === "ban") {
      return isHeroBannedByAnyoneThisGame(current, hero.slug) ? "banned" : "available";
    }
    if (isHeroBannedByAnyoneThisGame(current, hero.slug)) return "banned";
    if (isHeroPickedThisGame(current, hero.slug)) return "picked";
    if (step.phase === "pick" && isHeroLockedForTeam(seriesState, step.team, hero.slug)) return "picked";
    return "available";
  }

  const suggestions = gameComplete
    ? []
    : getSuggestions({
        availableHeroes: effectiveHeroes.filter((h) => isSelectable(seriesState, step, h.slug)),
        phase: step.phase,
        teamPickEntries: seriesState.current.picks[step.team],
        enemyPickEntries: seriesState.current.picks[step.team === "A" ? "B" : "A"],
        algorithmMode,
        getComfortLevel: (hero) => isComfortHero(hero.slug),
        topN: 10,
      });

  const completeLabel = seriesComplete ? "SERIES COMPLETE" : `GAME ${seriesState.game} DRAFT COMPLETE`;
  const phaseLabel = step.phase === "complete" ? null : `PHASE ${step.subPhase} \u00b7 ${step.phase === "ban" ? "BAN" : "PICK"}`;

  return (
    <div className="min-h-screen" style={{ background: "#12141a", color: "#e8e6e1" }}>
      <RoleSelectModal hero={pendingHero} onChoose={handleRoleChosen} onCancel={() => setPendingHero(null)} />

      <div className="max-w-[1280px] mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <Link href="/" className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors">
            <ArrowLeft size={15} /> Mode select
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-2xl tracking-wide" style={{ color: "#f2efe9" }}>
              TOURNAMENT DRAFT
            </h1>
            <span
              className="font-display font-bold text-xs tracking-wide rounded-full px-2.5 py-1"
              style={{ background: "rgba(245,196,81,0.12)", color: "#f5c451", border: "1px solid rgba(245,196,81,0.35)" }}
            >
              GAME {seriesState.game} / {seriesState.matchLength} &middot; BO{seriesState.matchLength}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 font-display font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: history.length === 0 ? undefined : "#e8e6e1" }}
            >
              <Undo2 size={14} /> Undo
            </button>
            <button onClick={resetSeries} className="flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors">
              <RotateCcw size={14} /> Reset Series
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-4 rounded-lg px-4 py-2.5" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                style={{ width: 16, height: 16, top: 2, left: 2, transform: algorithmMode === "comfort" ? "translateX(20px)" : "translateX(0)" }}
              />
            </div>
            <span className="font-display font-semibold text-xs tracking-wide" style={{ color: algorithmMode === "comfort" ? "#e879f9" : "#e8e6e1" }}>
              {algorithmMode === "comfort" ? "COMFORT-WEIGHTED" : "STANDARD"}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/tier-list"
              className="flex items-center gap-1.5 font-display font-bold text-xs tracking-wide rounded-md px-3.5 py-1.5 transition-all"
              style={{ background: "rgba(245,196,81,0.12)", color: "#f5c451", border: "1px solid rgba(245,196,81,0.35)" }}
            >
              <ListTree size={13} /> Tier List
            </Link>
            <Link
              href="/comfort-picks"
              className="flex items-center gap-1.5 font-display font-bold text-xs tracking-wide rounded-md px-3.5 py-1.5 transition-all"
              style={{ background: "rgba(232,121,249,0.12)", color: "#e879f9", border: "1px solid rgba(232,121,249,0.35)" }}
            >
              <Heart size={13} fill="#e879f9" /> Comfort Heroes ({totalAssignments})
            </Link>
          </div>
        </div>

        {(seriesState.seriesPicks.A.length > 0 || seriesState.seriesPicks.B.length > 0) && (
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4 rounded-lg px-4 py-2" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LockedStrip side="A" slugs={seriesState.seriesPicks.A} />
            <LockedStrip side="B" slugs={seriesState.seriesPicks.B} />
          </div>
        )}

        <TurnIndicator step={step} totalBans={TOTAL_BANS} totalPicks={TOTAL_PICKS} completeLabel={completeLabel} phaseLabel={phaseLabel} />

        {gameComplete && !seriesComplete && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleNextGame}
              className="flex items-center gap-1.5 font-display font-bold text-sm tracking-wide rounded-lg px-5 py-2.5 transition-all"
              style={{ background: "rgba(245,196,81,0.15)", color: "#f5c451", border: "1px solid rgba(245,196,81,0.45)" }}
            >
              Start Game {seriesState.game + 1} <ChevronRight size={15} />
            </button>
          </div>
        )}

        {seriesComplete && (
          <div className="flex justify-center mb-4">
            <button
              onClick={resetSeries}
              className="flex items-center gap-1.5 font-display font-bold text-sm tracking-wide rounded-lg px-5 py-2.5 transition-all"
              style={{ background: "rgba(245,196,81,0.15)", color: "#f5c451", border: "1px solid rgba(245,196,81,0.45)" }}
            >
              <Trophy size={15} /> New Series
            </button>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-6 items-start">
          <TeamPanel
            side="A"
            name="TEAM A"
            bans={seriesState.current.bans.A}
            picks={seriesState.current.picks.A}
            activeStep={step}
            banCount={BANS_PER_SIDE}
            pickCount={PICKS_PER_SIDE}
          />
          <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.08)" }} />
          <TeamPanel
            side="B"
            name="TEAM B"
            bans={seriesState.current.bans.B}
            picks={seriesState.current.picks.B}
            activeStep={step}
            banCount={BANS_PER_SIDE}
            pickCount={PICKS_PER_SIDE}
          />
        </div>

        <div className="rounded-lg p-4" style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.06)" }}>
          <AISuggestPanel suggestions={suggestions} phase={step.phase} onSelect={handleSelect} disabled={gameComplete} />
          <HeroGrid
            heroes={effectiveHeroes}
            getStatus={getStatus}
            onSelect={handleSelect}
            disabled={gameComplete}
            getComfortLevel={(hero) => isComfortHero(hero.slug)}
          />
        </div>
      </div>
    </div>
  );
}