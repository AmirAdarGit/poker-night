-- =============================================================================
-- Poker Night — Supabase schema (v2: auth + history)
--
-- Run this once in your Supabase project SQL editor.
-- IMPORTANT: this file WIPES public.games, public.profiles, public.game_players
--            on every run. Schema is idempotent; data is not preserved.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. Wipe (per user's migration choice)
-- ----------------------------------------------------------------------------
drop table if exists public.game_players cascade;
drop table if exists public.games cascade;
drop table if exists public.profiles cascade;

-- ----------------------------------------------------------------------------
-- 1. profiles — extends auth.users with public-readable display info
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  created_at timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles (lower(display_name));
create index profiles_email_idx on public.profiles (lower(email));

-- ----------------------------------------------------------------------------
-- 2. games — adds host_id, name, completed_at
-- ----------------------------------------------------------------------------
create table public.games (
  id text primary key,
  host_id uuid references auth.users(id) on delete set null,
  name text,
  state jsonb not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_host_idx on public.games (host_id, created_at desc);
create index games_updated_at_idx on public.games (updated_at desc);

-- Auto-update updated_at on every change.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.games
  for each row
  execute function public.tg_set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. game_players — link table for "who played in which game" (history)
-- ----------------------------------------------------------------------------
create table public.game_players (
  game_id text references public.games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create index game_players_user_idx on public.game_players (user_id, joined_at desc);

-- ----------------------------------------------------------------------------
-- 4. Auto-create a profile row when a new user signs up.
-- The display_name comes from raw_user_meta_data.display_name (set during
-- signup) or falls back to the OAuth provider's full_name / name / email-prefix.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================

-- ---- profiles ----
alter table public.profiles enable row level security;

-- Anyone (incl. anon) can read profiles. We need this so that opponents'
-- display_names render in the history view, and so the player-picker can
-- search registered users by email.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---- games ----
alter table public.games enable row level security;

-- SELECT: anyone with the (unguessable) ID can view a game. The game ID
-- functions as a bearer token, like a Calendly link.
create policy "games are publicly readable"
  on public.games for select
  using (true);

-- INSERT: must be the host you say you are.
create policy "users can create games as themselves"
  on public.games for insert
  with check (auth.uid() = host_id);

-- UPDATE: only the host. with check ensures host_id can't be reassigned.
create policy "host can update own games"
  on public.games for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- DELETE (rare; host can clear their own games)
create policy "host can delete own games"
  on public.games for delete
  using (auth.uid() = host_id);

-- ---- game_players ----
alter table public.game_players enable row level security;

-- SELECT: a row is visible if you are the player, OR you are the host of the
-- linked game (so the host can see participant lists), OR the game is publicly
-- linked (which it always is, since it has no privacy beyond the ID). For
-- simplicity we just allow public read of the link table — it only contains
-- (game_id, user_id) pairs which together with profiles let history render.
create policy "game_players are publicly readable"
  on public.game_players for select
  using (true);

-- INSERT: only the host of the game can add players to it.
create policy "host can add players to own games"
  on public.game_players for insert
  with check (
    exists (
      select 1 from public.games g
      where g.id = game_id and g.host_id = auth.uid()
    )
  );

-- DELETE: host can remove players (e.g., remove a player mid-game).
create policy "host can remove players from own games"
  on public.game_players for delete
  using (
    exists (
      select 1 from public.games g
      where g.id = game_id and g.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Realtime
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Add games to realtime (re-add is a no-op if already present).
do $$
begin
  begin
    alter publication supabase_realtime add table public.games;
  exception when duplicate_object then null;
  end;
end $$;
