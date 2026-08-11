# HoK Draft Pick

AI-assisted draft pick simulator for Honor of Kings (international server).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
app/
  page.jsx                 Mode select (Rank Draft / Tournament Draft)
  rank-draft/page.jsx       Rank Draft board (working)
  tournament-draft/page.jsx Placeholder, not built yet
components/
  HeroGrid.jsx              Searchable, filterable hero grid
  HeroCard.jsx              Single hero tile (image, tier, roles, ban/pick state)
  TeamPanel.jsx             Ban slots + pick slots per team
  TurnIndicator.jsx         Current phase / whose turn
  TierBadge.jsx             S/A/B/C chevron badge
lib/
  heroes.js                 Hero data loader + role/tier constants
  rankDraft.js               Rank Draft turn-order state machine
data/
  heroes.json                116 heroes, international server (name, tier, roles, image, etc.)
```

## Rank Draft rules currently implemented

- Phase 1: 3 bans, alternating Team A → Team B → Team A
- Phase 2: 5 picks per team (10 total), snake order A,B,B,A,A,B,B,A,A,B

**These orders are assumptions**, not confirmed against real HoK ranked draft order.
Change them in `lib/rankDraft.js` (`BAN_ORDER` / `PICK_ORDER`) if the real sequence differs —
everything else (state machine, UI) reads from those two arrays.

## Data source

Hero roster, tiers, and lane assignments scraped from hokstats.gg (international server tier list),
current as of Season 15.a (2026-07-30). Images are hotlinked from hokstats.gg's splash-art CDN —
fine for prototyping, but should be mirrored to your own storage before any production use.

## Not built yet

- Tournament Draft (2 bans → 3 picks → 2 bans → 2 picks)
- AI recommendation engine (win rate / counters / synergy scoring)
- Per-role hero stats (win/pick/ban rate) — only tier + roles are in `heroes.json` right now
