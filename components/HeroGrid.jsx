"use client";

import { useMemo, useState } from "react";
import { HEROES, ROLES, sortByTier } from "@/lib/heroes";
import HeroCard from "./HeroCard";
import { Search, X } from "lucide-react";

// getStatus(hero) => "available" | "banned" | "picked"
export default function HeroGrid({ getStatus, onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState("All");

  const filtered = useMemo(() => {
    let list = HEROES;
    if (activeRole !== "All") list = list.filter((h) => h.roles.includes(activeRole));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q));
    }
    return sortByTier(list);
  }, [query, activeRole]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...ROLES].map((r) => {
            const isActive = activeRole === r;
            return (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className="font-display font-semibold rounded px-3 py-1.5 text-[13px] tracking-wide transition-all"
                style={{
                  border: `1px solid ${isActive ? "#f5c451" : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? "#f5c45122" : "transparent",
                  color: isActive ? "#f5c451" : "#8a94a6",
                }}
              >
                {r}
              </button>
            );
          })}
        </div>

        <div className="relative w-56">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hero..."
            className="w-full rounded px-8 py-1.5 text-[13px] outline-none font-body"
            style={{
              background: "#1a1e26",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e8e6e1",
            }}
          />
          {query && (
            <X
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
              onClick={() => setQuery("")}
            />
          )}
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
        {filtered.map((hero) => (
          <HeroCard
            key={hero.slug}
            hero={hero}
            status={getStatus(hero)}
            onClick={onSelect}
            disabled={disabled}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 font-display">No heroes match your filters.</div>
      )}
    </div>
  );
}
