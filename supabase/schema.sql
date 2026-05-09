-- =============================================================================
-- Poker Night — Supabase schema (v3: name-based players, link-grants-edit)
--
-- Run this once in your Supabase project SQL editor.
-- IMPORTANT: this file WIPES public.games and public.profiles on every run.
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

-- ----------------------------------------------------------------------------
-- 2. games — host_id for attribution, public read+write (link is the trust)
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
-- 3. Auto-create a profile row when a new user signs up.
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
-- 4. Row Level Security
-- ============================================================================

-- ---- profiles ----
alter table public.profiles enable row level security;

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

-- SELECT: anyone with the (unguessable) ID can view a game.
create policy "games are publicly readable"
  on public.games for select
  using (true);

-- INSERT: must be a logged-in user creating a game as themselves.
create policy "users can create games as themselves"
  on public.games for insert
  with check (auth.uid() = host_id);

-- UPDATE: anyone can update. The link is the trust boundary — sharing it
-- means granting edit permission. host_id is locked so only the original
-- host can be reassigned/cleared (and only via direct DB access, not RLS).
create policy "anyone can update games"
  on public.games for update
  using (true)
  with check (true);

-- DELETE: only the host.
create policy "host can delete own games"
  on public.games for delete
  using (auth.uid() = host_id);

-- ============================================================================
-- 5. Realtime
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.games;
  exception when duplicate_object then null;
  end;
end $$;
