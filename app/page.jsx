import Link from "next/link";
import { Swords, Trophy } from "lucide-react";

function ModeCard({ href, icon, title, phases, disabled }) {
  const Comp = disabled ? "div" : Link;
  return (
    <Comp
      href={disabled ? undefined : href}
      className="group relative flex flex-col gap-4 rounded-xl p-7 transition-all duration-200"
      style={{
        background: "#1a1e26",
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(245,196,81,0.1)", color: "#f5c451" }}
      >
        {icon}
      </div>
      <div>
        <h2 className="font-display font-bold text-2xl tracking-wide" style={{ color: "#f2efe9" }}>
          {title}
        </h2>
        {disabled && (
          <span className="font-display text-xs font-semibold tracking-widest text-gray-500">
            COMING SOON
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 mt-1">
        {phases.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-body text-gray-400">
            <span
              className="font-display font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "#8a94a6" }}
            >
              {i + 1}
            </span>
            {p}
          </div>
        ))}
      </div>
    </Comp>
  );
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "#12141a", color: "#e8e6e1" }}
    >
      <div className="text-center mb-10">
        <div className="font-display text-xs font-semibold tracking-[0.3em] text-gray-500 mb-2">
          HONOR OF KINGS · INTERNATIONAL SERVER
        </div>
        <h1 className="font-display font-bold text-4xl tracking-wide" style={{ color: "#f2efe9" }}>
          DRAFT PICK
        </h1>
        <p className="font-body text-sm text-gray-500 mt-2">Choose a draft format to begin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl w-full">
        <ModeCard
          href="/rank-draft"
          icon={<Swords size={22} />}
          title="RANK DRAFT"
          phases={["Phase 1 — 3 bans", "Phase 2 — 5 picks per team"]}
        />
        <ModeCard
          href="/tournament-draft"
          icon={<Trophy size={22} />}
          title="TOURNAMENT DRAFT"
          phases={[
            "Phase 1 — 2 bans, 3 picks",
            "Phase 2 — 2 bans, 2 picks",
          ]}
          disabled
        />
      </div>
    </div>
  );
}
