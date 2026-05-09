# Poker Night 🃏

Hebrew (RTL) poker night money tracker with **real-time multi-device sync**, **user accounts**, and **lifetime P&L history**. Built with Vite + React + TypeScript and Supabase. Deploys to Vercel with zero config.

## Features

- **Setup → Playing → Settlement** phase flow.
- **Real-time sync**: share a link mid-game, every device watching it sees updates live.
- **Auth**: Google OAuth (primary) + email/password fallback.
- **Multi-user**: every player is a registered user. Hosts pick from past co-players or invite by email.
- **Host-only edits**: only the host of a game can change buy-ins, cash-outs, etc. Others watch live.
- **History**: every signed-in user sees their past games + lifetime profit/loss + per-opponent breakdown.
- **Offline tolerance**: keeps working with the last-known state and syncs when connectivity returns.

## Quick start

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable key)
npm run dev
```

## Setting up Supabase

### 1. Create the project
[supabase.com](https://supabase.com) → **New project**.

### 2. Run the schema
**SQL Editor → New query** → paste [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.

> The schema **wipes** any existing `games` / `profiles` / `game_players` tables. Re-running is safe but destructive — only do it on a project where you're OK losing prior data.

It creates:
- `profiles` (extends `auth.users` with display name + email)
- `games` (with `host_id`, `state`, `completed_at`)
- `game_players` (link table for history queries)
- A trigger that auto-creates a `profiles` row when a user signs up
- RLS policies (see below)
- Realtime publication for `games`

### 3. Enable email auth
**Authentication → Providers → Email** → Enable. For dev convenience disable "Confirm email" so signup is one-step.

### 4. Enable Google OAuth (recommended)
1. **Authentication → Providers → Google** → toggle on.
2. Copy the **Callback URL** Supabase shows you.
3. Go to [Google Cloud Console](https://console.cloud.google.com) → create or pick a project → **APIs & Services → Credentials → + Create credentials → OAuth client ID**:
   - Type: **Web application**
   - **Authorized redirect URIs**: paste the Supabase callback URL
4. Copy the resulting **Client ID** and **Client Secret** back into Supabase's Google provider form.
5. **Save**.

### 5. Configure URL allowlist
**Authentication → URL Configuration**:
- **Site URL**: your Vercel prod URL (e.g. `https://poker-night.vercel.app`)
- **Redirect URLs**: add both:
  - `http://localhost:5173`
  - `https://poker-night.vercel.app` (and any preview URLs you use)

### 6. Grab credentials for the app
**Project Settings → API**:
- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable key** (`sb_publishable_...`) → `VITE_SUPABASE_ANON_KEY`

> Never use the **Secret key** in this app. It bypasses RLS and would expose every table to the browser.

## Permissions model

| Action | Who |
|---|---|
| Create a game | Logged-in user (becomes the host) |
| Edit a game (buy-ins, cash-outs, phase transitions, add/remove players) | Host only |
| View a game | **Anyone with the link** — logged in or not. The 8-char ID acts as a bearer token. |
| Add/remove `game_players` rows | Host only (enforced by RLS) |
| Read `profiles` | Public (so opponent names render in history) |
| See history | Per user — only games where you participated |

## Deploying to Vercel

Connect the GitHub repo on [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite. In **Environment Variables** set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

[`vercel.json`](./vercel.json) already rewrites all routes to `index.html` so `?g=<id>` links work.

After deploy, push to `main` to redeploy. For ad-hoc CLI deploys: `npm i -g vercel && vercel --prod`.

## Architecture

### Sync model

- Single source of truth is the row in Supabase `games` keyed by short ID.
- **Setup phase is local-only**: no row exists until "start game" is pressed. Avoids polluting the DB with abandoned setups.
- **URL contains only the game ID**: format `?g=<id>`. No state in the URL.
- **Optimistic UI**: every host action updates local state immediately and pushes to Supabase. On failure, a toast surfaces the error.
- **Realtime subscription**: all devices viewing the game subscribe to row changes via Supabase Realtime.
- **Offline fallback**: if Supabase is unreachable, the app keeps working locally with the last-known state and shows an offline banner. When connectivity returns, the latest local state is pushed (last-write-wins).
- **localStorage cache**: each game's last-seen state is cached, so reopening a link is instant even before Supabase responds.
- **Last-write-wins**: friends won't be editing the same field at the same millisecond. If two devices race, the later push wins.

### State model

```ts
interface Player {
  id: string;                  // = auth.users.id (uuid)
  name: string;                // snapshotted from profiles.display_name
  buyIns: number[];
  cashedOut: number | null;
  joinedAt: number;
}

interface GameState {
  phase: 'setup' | 'playing' | 'settlement';
  players: Player[];
}
```

### History & P&L

- `game_players` is the source of truth for "which user played in which game."
- It's kept in sync with `state.players` after every successful host push (see `useGameSync.ts`).
- The History view queries `game_players` for a user, joins back to `games`, and computes:
  - **Lifetime net**: sum of `getNet(me)` across all settled games where I cashed out.
  - **Per-opponent net**: my total net across the games where each opponent also played. (Not "money I won from them directly" — that's not well-defined in poker — but a faithful "in games where X played, you came out ahead/behind by N₪.")

### Project layout

```
src/
  App.tsx                          # phase + view router; wires auth + sync
  main.tsx
  types.ts
  styles/
    _variables.scss                # ★ ONLY file with hex colors
    _mixins.scss
    global.scss
  contexts/
    AuthContext.tsx                # session, profile, signIn/signOut
  hooks/
    useGameSync.ts                 # realtime + optimistic + host-guard
    useOnlineStatus.ts
  reducer/
    gameReducer.ts
  lib/
    supabase.ts
    gameId.ts
    settlement.ts                  # greedy debtor↔creditor matcher
    settlement.test.ts
    storage.ts
    share.ts
    players.ts                     # lookup by email + recent co-players
    history.ts                     # fetch games + compute lifetime / opponent stats
  components/
    AuthScreen/                    # login + signup (Google + email/pw)
    CompleteProfile/               # display_name capture if missing
    UserMenu/                      # header user dropdown
    HistoryView/                   # past games + lifetime + opponent breakdown
    SetupPhase/                    # add players (recent + email lookup)
    PlayingPhase/                  # buy-ins, cash-outs (host); live view (others)
    SettlementPhase/               # net results + minimal transfers
    PlayerCard/
    OfflineBanner/
    Toast/
    ConfirmDialog/
```

## Scripts

```bash
npm run dev         # start Vite dev server
npm run build       # type-check then build
npm run preview     # preview the prod build locally
npm run typecheck   # tsc --noEmit
npm run test        # run vitest once
npm run test:watch  # vitest in watch mode
```

## Conventions

- TypeScript strict + `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`.
- SCSS modules per component. Global partials in `src/styles`.
- **No hex colors outside `src/styles/_variables.scss`.**
- No CSS frameworks, no UI libraries, no external state libraries, no router.

## License

MIT
