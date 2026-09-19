"use client";

import Image from "next/image";
import { ROLE_COLOR } from "@/lib/heroes";
import { X } from "lucide-react";

// hero: the flex hero pending a role choice
// onChoose(role) / onCancel()
export default function RoleSelectModal({ hero, onChoose, onCancel }) {
  if (!hero) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(10,11,14,0.75)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-5 w-full max-w-sm"
        style={{ background: "#1a1e26", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#0f1115]">
              <Image src={hero.image} alt={hero.name} fill className="object-contain p-0.5" unoptimized />
            </div>
            <div>
              <div className="font-display font-bold text-base" style={{ color: "#f2efe9" }}>
                {hero.name}
              </div>
              <div className="font-body text-xs text-gray-500">Play as which lane?</div>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {hero.roles.map((role) => (
            <button
              key={role}
              onClick={() => onChoose(role)}
              className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 font-display font-semibold text-sm transition-all"
              style={{
                background: `${ROLE_COLOR[role]}18`,
                border: `1px solid ${ROLE_COLOR[role]}55`,
                color: "#f2efe9",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${ROLE_COLOR[role]}30`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${ROLE_COLOR[role]}18`)}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_COLOR[role] }} />
              Play as {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}