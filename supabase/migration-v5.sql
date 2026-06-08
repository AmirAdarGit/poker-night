-- =============================================================================
-- Poker Night — migration v5: multi-tenant GROUPS / CLUBS
--
-- Run once in the Supabase SQL editor. Additive + idempotent: it does NOT drop
-- games / roster_players. It scopes them to a group and replaces the old
-- "link is trust" RLS with membership-based access.
--
-- ASSUMES PROD IS WIPED. Any roster_players / games rows left without a
-- group_id are deleted before the NOT NULL constraints are added (see step 8).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. groups
-- ----------------------------------------------------------------------------
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups (owner_id);

-- ----------------------------------------------------------------------------
-- 2. group_members — composite PK keeps membership unique per (group, user)
-- ----------------------------------------------------------------------------
create table if not exists public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- ----------------------------------------------------------------------------
-- 3. Scope roster_players + games to a group (nullable now, enforced in step 8)
-- ----------------------------------------------------------------------------
alter table public.roster_players
  add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.games
  add column if not exists group_id uuid references public.groups(id) on delete cascade;

create index if not exists roster_players_group_idx on public.roster_players (group_id);
create index if not exists games_group_idx on public.games (group_id, updated_at desc);

-- Roster name uniqueness is now PER GROUP, not global.
drop index if exists public.roster_players_name_idx;
create unique index if not exists roster_players_group_name_idx
  on public.roster_players (group_id, lower(btrim(name)));

-- ----------------------------------------------------------------------------
-- 4. Helpers
-- ----------------------------------------------------------------------------

-- Ambiguity-free 8-char invite code (mirrors src/lib/gameId.ts alphabet).
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- New groups get a code automatically; the app retries on the rare collision.
alter table public.groups alter column invite_code set default public.gen_invite_code();

-- Membership check. SECURITY DEFINER bypasses RLS so policies on group_members
-- can call it without recursing on themselves.
create or replace function public.is_group_member(g uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = g and user_id = auth.uid()
  );
$$;
revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

create or replace function public.is_group_owner(g uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.groups where id = g and owner_id = auth.uid()
  );
$$;
revoke all on function public.is_group_owner(uuid) from public;
grant execute on function public.is_group_owner(uuid) to authenticated;

-- Join by code: lets a non-member join without a broad SELECT policy on groups.
create or replace function public.join_group_by_code(code text)
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  g public.groups;
begin
  select * into g from public.groups where invite_code = lower(btrim(code));
  if g.id is null then
    raise exception 'invalid_invite_code';
  end if;
  insert into public.group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  return g;
end;
$$;
revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Owner becomes a member automatically on group creation, so
--    is_group_member() is true for the creator's own group.
-- ----------------------------------------------------------------------------
create or replace function public.tg_group_owner_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.tg_group_owner_membership();

-- ============================================================================
-- 6. RLS — groups + group_members
-- ============================================================================
alter table public.groups enable row level security;

drop policy if exists "members read their groups" on public.groups;
create policy "members read their groups"
  on public.groups for select using (public.is_group_member(id));

drop policy if exists "users create groups they own" on public.groups;
create policy "users create groups they own"
  on public.groups for insert with check (auth.uid() = owner_id);

drop policy if exists "owner updates group" on public.groups;
create policy "owner updates group"
  on public.groups for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owner deletes group" on public.groups;
create policy "owner deletes group"
  on public.groups for delete using (auth.uid() = owner_id);

alter table public.group_members enable row level security;

drop policy if exists "members read co-members" on public.group_members;
create policy "members read co-members"
  on public.group_members for select using (public.is_group_member(group_id));

drop policy if exists "users join groups" on public.group_members;
create policy "users join groups"
  on public.group_members for insert
  with check (user_id = auth.uid() or public.is_group_owner(group_id));

drop policy if exists "users leave or owner removes" on public.group_members;
create policy "users leave or owner removes"
  on public.group_members for delete
  using (user_id = auth.uid() or public.is_group_owner(group_id));

-- ============================================================================
-- 7. RLS — roster_players + games (replace the global "link is trust" model)
-- ============================================================================
drop policy if exists "roster is publicly readable" on public.roster_players;
drop policy if exists "signed-in users can add roster players" on public.roster_players;

create policy "members read group roster"
  on public.roster_players for select using (public.is_group_member(group_id));
create policy "members add group roster"
  on public.roster_players for insert with check (public.is_group_member(group_id));
create policy "members update group roster"
  on public.roster_players for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
create policy "members delete group roster"
  on public.roster_players for delete using (public.is_group_member(group_id));

drop policy if exists "games are publicly readable" on public.games;
drop policy if exists "users can create games as themselves" on public.games;
drop policy if exists "anyone can update games" on public.games;
drop policy if exists "host can delete own games" on public.games;

create policy "members read group games"
  on public.games for select using (public.is_group_member(group_id));
create policy "members create group games"
  on public.games for insert
  with check (auth.uid() = host_id and public.is_group_member(group_id));
create policy "members update group games"
  on public.games for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
create policy "host deletes group games"
  on public.games for delete
  using (auth.uid() = host_id and public.is_group_member(group_id));

-- ============================================================================
-- 8. Finalize — drop orphan rows (prod wiped) and lock scoping in.
-- ============================================================================
delete from public.roster_players where group_id is null;
delete from public.games where group_id is null;

alter table public.roster_players alter column group_id set not null;
alter table public.games alter column group_id set not null;
