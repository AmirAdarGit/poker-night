-- =============================================================================
-- Poker Night — migration v7: one-time PRO unlock
--
-- Run once in the Supabase SQL editor. Additive + idempotent: it does NOT drop
-- or wipe anything.
--
-- Adds a per-user "pro" entitlement. The free trial (5 games hosted OR 60 days
-- since signup, enforced client-side in src/lib/entitlement.ts) gates creating
-- NEW games; once trial is over the user must unlock Pro to keep creating.
--
-- SECURITY: is_pro / pro_since are server-truth. The existing self-update RLS
-- policy on profiles ("users can update their own profile") would otherwise let
-- a client flip is_pro=true itself. A BEFORE UPDATE trigger pins these columns
-- to their old values for any non-service-role caller, so they can only be set
-- by the activate-pro Edge Function (which uses the service-role key).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columns
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_pro boolean not null default false;
alter table public.profiles
  add column if not exists pro_since timestamptz;

-- ----------------------------------------------------------------------------
-- 2. Guard: only the service role may change is_pro / pro_since.
--    Normal authenticated updates keep the old values (silently ignored).
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
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_pro on public.profiles;
create trigger guard_profile_pro
  before update on public.profiles
  for each row
  execute function public.tg_guard_profile_pro();
