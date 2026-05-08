-- =============================================================================
-- Poker Night — Supabase schema
-- Run this once in your Supabase project SQL editor.
-- =============================================================================

create table if not exists public.games (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists games_updated_at_idx
  on public.games (updated_at desc);

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

drop trigger if exists set_updated_at on public.games;
create trigger set_updated_at
  before update on public.games
  for each row
  execute function public.tg_set_updated_at();

-- =============================================================================
-- Row Level Security
-- This is a hobby app with no auth — anyone with a game ID can read/write that
-- game. Since IDs are 8 chars from a 32-char alphabet (~10^12 combinations) they
-- act as unguessable bearer tokens. If you want stricter access, add auth and
-- scope policies to authenticated users.
-- =============================================================================

alter table public.games enable row level security;

drop policy if exists "anyone can read games" on public.games;
create policy "anyone can read games"
  on public.games for select
  using (true);

drop policy if exists "anyone can insert games" on public.games;
create policy "anyone can insert games"
  on public.games for insert
  with check (true);

drop policy if exists "anyone can update games" on public.games;
create policy "anyone can update games"
  on public.games for update
  using (true)
  with check (true);

-- =============================================================================
-- Realtime
-- =============================================================================

-- Make sure the realtime publication exists, then add this table to it.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.games;
