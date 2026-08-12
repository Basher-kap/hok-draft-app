"use client";

import Image from "next/image";
import { ROLE_COLOR } from "@/lib/heroes";
import { X } from "lucide-react";

// hero: the flex hero (2+ roles) awaiting a role choice
// filledLanes: Set of lanes your team already has covered - shown as a hint,
// doesn't block the choice (you can still double up on a lane on purpose)
// onSelectRole: (role) => void - commits the pick with that role
// onCancel: () => void - backs out without picking
export default function RoleSelectModal({ hero, filledLanes, onSelectRole, onCancel }) {
  if (!hero) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,11,14,0.75)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-5 w-full max-w-xs"
        style={{ background: "#161920", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-[#0f1115] shrink-0">
              <Image src={hero.image} alt={hero.name} fill className="object-cover object-top" unoptimized />
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "#f2efe9" }}>
                {hero.name}
              </div>
              <div className="font-body text-xs text-gray-500">Play as which role?</div>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {hero.roles.map((r) => {
            const alreadyFilled = filledLanes?.has(r);
            return (
              <button
                key={r}
                onClick={() => onSelectRole(r)}
                className="flex items-center justify-between rounded-lg px-4 py-2.5 font-display font-semibold text-sm transition-all"
                style={{
                  background: "#1a1e26",
                  border: `1px solid ${ROLE_COLOR[r]}55`,
                  color: "#e8e6e1",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = ROLE_COLOR[r])}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${ROLE_COLOR[r]}55`)}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_COLOR[r] }} />
                  Play as {r}
                </span>
                {alreadyFilled && (
                  <span className="font-body font-normal text-[10px] text-gray-500">lane filled</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}