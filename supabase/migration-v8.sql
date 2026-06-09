-- =============================================================================
-- Poker Night — migration v8: admin dashboard backend
--
-- Run once in the Supabase SQL editor. Additive + idempotent: it does NOT drop
-- or wipe anything.
--
-- Adds an `is_admin` entitlement (server-truth, like is_pro) plus a nullable
-- `locale` column (Phase 3 will populate it; the admin dashboard reads it now,
-- defaulting null -> 'unknown'). The admin-stats Edge Function gates all data
-- behind profiles.is_admin, so only the owner account can read the dashboard.
--
-- SECURITY: is_admin is server-truth. The existing self-update RLS policy on
-- profiles ("users can update their own profile") would otherwise let a client
-- flip is_admin=true itself. The v7 guard trigger already pins is_pro/pro_since
-- for non-service-role callers; we extend it to also pin is_admin. `locale`
-- stays user-settable for Phase 3, so it is NOT pinned.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columns
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;
alter table public.profiles
  add column if not exists locale text;

-- ----------------------------------------------------------------------------
-- 2. Bootstrap the admin account. Safe no-op if the row is absent.
-- ----------------------------------------------------------------------------
update public.profiles
  set is_admin = true
  where email = 'amiradar12345@gmail.com';

-- ----------------------------------------------------------------------------
-- 3. Guard: only the service role may change is_pro / pro_since / is_admin.
--    Normal authenticated updates keep the old values (silently ignored).
--    (locale stays user-settable, so it is intentionally NOT pinned here.)
-- ----------------------------------------------------------------------------
create or replace function public.tg_guard_profile_pro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.role() is 'service_role' for the service key, 'authenticated' for users.
  if coalesce(auth.role(), '') <> 'service_role' then
    new.is_pro := old.is_pro;
    new.pro_since := old.pro_since;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_pro on public.profiles;
create trigger guard_profile_pro
  before update on public.profiles
  for each row
  execute function public.tg_guard_profile_pro();

-- ----------------------------------------------------------------------------
-- 4. Helper: is the current caller an admin? SECURITY DEFINER bypasses RLS so
--    future policies can call it without recursing on the profiles policies.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin_user()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;
revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;
