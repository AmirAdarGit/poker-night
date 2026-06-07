-- =============================================================================
-- Poker Night — migration v4: fixed player roster + game close lifecycle
--
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
--   * Adds public.roster_players (the known list of friends).
--   * Seeds the initial 10 names.
--   * No change to public.games — `completed_at` already exists and is now
--     driven by the "Close Game" button (null = active, set = finished).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. roster_players — the shared, app-wide list of players to pick from.
-- ----------------------------------------------------------------------------
create table if not exists public.roster_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Names are the human key; keep them unique (case/space-insensitive).
create unique index if not exists roster_players_name_idx
  on public.roster_players (lower(btrim(name)));

-- ----------------------------------------------------------------------------
-- 2. Seed the initial roster. on conflict do nothing keeps re-runs safe and
--    lets you append names later by editing this list.
-- ----------------------------------------------------------------------------
insert into public.roster_players (name)
values
  ('אמיר אדר'),
  ('רז'),
  ('גל ששון'),
  ('איתי דוד'),
  ('ירדן'),
  ('זולא'),
  ('עמית'),
  ('איתמר'),
  ('בן'),
  ('עמרי')
on conflict (lower(btrim(name))) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security — readable by anyone, only signed-in users may add.
-- ----------------------------------------------------------------------------
alter table public.roster_players enable row level security;

drop policy if exists "roster is publicly readable" on public.roster_players;
create policy "roster is publicly readable"
  on public.roster_players for select
  using (true);

drop policy if exists "signed-in users can add roster players" on public.roster_players;
create policy "signed-in users can add roster players"
  on public.roster_players for insert
  with check (auth.uid() is not null);
