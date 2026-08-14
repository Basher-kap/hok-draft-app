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
  tournament-stats.json      Real pick/ban/win-rate data from a HoK esports tournament (empty
                              template until populated - see "Tournament stats" below)
```

## Blue Side / Red Side

Team A always leads the snake pick order (`PICK_ORDER` in `lib/rankDraft.js`), so it's
labeled **Blue Side / First Pick** and Team B is **Red Side / Counter Pick**
(`SIDE_META` in the same file). This is just a naming layer - the state machine
doesn't change.

Because the pick order is `A,B,B,A,A,B,B,A,A,B`, only the very first pick of the whole
draft (Blue's opener) is truly blind - every pick after that already has at least one
enemy hero on the board. The AI suggester (`lib/recommendation.js`) detects that one
blind moment automatically (no enemy picks AND no team picks yet) and, for that pick
only, leans harder on tier + tournament win rate/presence and adds a small penalty for
heroes with a lot of known hard counters, since revealing a heavily-counterable hero
into the unknown is the riskiest opening move. Every other pick already gets real
counter/synergy signal from the board, so Red's structural "always reacts to something"
advantage falls out of that data naturally - no extra hardcoding needed.

## Tournament stats

`data/tournament-stats.json` holds real pick/ban/win counts from a tournament (source
noted in `meta.source`/`meta.sourceUrl` in that file). It ships as an empty template -
`meta.totalGames: 0` and `heroes: {}` - so the AI suggester's stat bonus is inert until
it's populated. To fill it in:

1. Set `meta.totalGames` to the tournament's total games-played count.
2. For each hero, add `"slug": { "picks": N, "bans": N, "wins": N }` as **raw counts**,
   not percentages - `lib/heroes.js` (`tournamentStatsFor`) derives pick rate, ban rate,
   presence (pick+ban rate), and win rate from those counts, so there's one source of
   truth.
3. Set `meta.lastUpdated`.

A hero with no entry gets zero stat bonus, same as heroes missing from the counter/synergy
data - never penalized or guessed at. Win rate only affects scoring once a hero has at
least 5 recorded picks (`MIN_SAMPLE_GAMES` in `lib/recommendation.js`), so a 1-2 game
sample doesn't swing the ranking.

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