# Poker Night 🃏

Hebrew (RTL) poker night money tracker. Built with **Vite + React + TypeScript** and **Supabase** for real-time multi-device sync. Deploys to **Vercel** with zero config.

## What it does

Three phases:

1. **Setup** — host enters players locally. Default buy-in is 50 ₪. Minimum 2 to start.
2. **Playing** — track buy-ins (rebuys), cash-outs, undo mistakes, add mid-game players, see pot/active/cashed-out counts at all times.
3. **Settlement** — see each player's net win/loss sorted by winnings, plus a **minimal list of "X pays Y"** transfers using a greedy debtor↔creditor matcher.

The killer feature: share the link mid-game and every device watching it sees updates in real-time via Supabase Realtime.

## Quick start

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql). This creates the `games` table, RLS policies, and adds the table to the realtime publication.
3. Copy your project's URL and `anon` key into `.env`.

The schema gives anyone with a game ID full read/write access. Game IDs are 8 random characters from a 32-char alphabet (~10¹² combinations), so they act as unguessable bearer tokens — fine for a hobby app among friends. If you want stricter access, layer auth on top.

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Then set the env vars in the Vercel dashboard (Project → Settings → Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

[`vercel.json`](./vercel.json) is set up to rewrite all routes to `index.html` so that opening `?g=<id>` links works under all paths.

## Architecture

### Sync model

- **Single source of truth** is the row in Supabase `games` keyed by short ID.
- **Setup phase is local-only**: no row exists until "start game" is pressed. Avoids polluting the DB with abandoned setups.
- **URL contains only the game ID**: format `?g=<id>`. No state in the URL/hash.
- **Optimistic UI**: every action updates local state immediately and pushes to Supabase. On failure, a toast surfaces the error; the next dispatch retries.
- **Realtime subscription**: all devices viewing the game subscribe to changes on its row. Incoming updates replace local state.
- **Offline fallback**: if the device is offline (or Supabase is unreachable), the app keeps working locally with the last-known state and shows an offline banner. When connectivity returns, the latest local state is pushed (last-write-wins).
- **localStorage cache**: each game's last-seen state is cached, so reopening a link is instant even before Supabase responds.
- **Last-write-wins**: friends won't be editing the same field at the same millisecond. If two devices race, the later push wins. Document accordingly.

### State

```ts
interface Player {
  id: string;
  name: string;
  buyIns: number[];
  cashedOut: number | null;
  joinedAt: number;
}

interface GameState {
  phase: 'setup' | 'playing' | 'settlement';
  players: Player[];
}
```

Reducer in [`src/reducer/gameReducer.ts`](./src/reducer/gameReducer.ts). Settlement algorithm and tests in [`src/lib/settlement.ts`](./src/lib/settlement.ts) and [`src/lib/settlement.test.ts`](./src/lib/settlement.test.ts).

### Project layout

```
src/
  App.tsx                       # phase router + sync wiring
  main.tsx
  types.ts                      # GameState, Player, helpers
  styles/
    _variables.scss             # ★ ONLY file with hex colors
    _mixins.scss
    global.scss
  lib/
    supabase.ts                 # client + fetch/upsert helpers
    gameId.ts                   # short URL-safe IDs
    settlement.ts               # greedy debtor↔creditor matcher
    settlement.test.ts          # vitest suite
    storage.ts                  # localStorage cache
    share.ts                    # navigator.share + clipboard fallback
  hooks/
    useGameSync.ts              # realtime + optimistic + offline
    useOnlineStatus.ts
  reducer/
    gameReducer.ts
  components/
    SetupPhase/
    PlayingPhase/
    SettlementPhase/
    PlayerCard/
    OfflineBanner/
    Toast/
    ConfirmDialog/
```

## Conventions

- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`.
- **SCSS modules** per component. Global partials live in `src/styles`.
- **No hex colors anywhere outside `src/styles/_variables.scss`.** Every `.module.scss` imports the variables and uses named tokens. This rule is non-negotiable.
- **No CSS frameworks**, no UI libraries, no external state libraries, no router.
- **Reducer + `URLSearchParams`** is enough.

## Scripts

```bash
npm run dev         # start Vite dev server
npm run build       # type-check then build
npm run preview     # preview the prod build locally
npm run typecheck   # tsc --noEmit
npm run test        # run vitest once
npm run test:watch  # vitest in watch mode
```

## License

MIT
