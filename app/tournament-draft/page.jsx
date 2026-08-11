import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TournamentDraftPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "#12141a", color: "#e8e6e1" }}
    >
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 font-display font-semibold text-sm text-gray-400 hover:text-gray-200"
      >
        <ArrowLeft size={15} /> Mode select
      </Link>
      <h1 className="font-display font-bold text-2xl tracking-wide mb-2" style={{ color: "#f2efe9" }}>
        TOURNAMENT DRAFT
      </h1>
      <p className="font-body text-sm text-gray-500 max-w-md text-center">
        Phase 1 (2 bans → 3 picks) and Phase 2 (2 bans → 2 picks) are next on the roadmap,
        once Rank Draft is confirmed working the way you want.
      </p>
    </div>
  );
}
