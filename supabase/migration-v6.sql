-- =============================================================================
-- Poker Night — migration v6: create_group RPC
--
-- Run once in the Supabase SQL editor. Idempotent.
--
-- Fixes "create group failed": the client used insert().select(), and reading
-- the returned row back went through the groups SELECT policy
-- (is_group_member), but membership is granted by the AFTER-INSERT trigger — a
-- timing gotcha that made the read fail even though the insert succeeded.
-- This SECURITY DEFINER RPC inserts and returns the row directly, mirroring
-- join_group_by_code.
-- =============================================================================

create or replace function public.create_group(p_name text)
returns public.groups
language plpgsql security definer set search_path = public
as $$
declare
  g public.groups;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'empty_name';
  end if;
  -- The on_group_created trigger adds the owner to group_members.
  insert into public.groups (name, owner_id)
  values (btrim(p_name), auth.uid())
  returning * into g;
  return g;
end;
$$;

revoke all on function public.create_group(text) from public;
grant execute on function public.create_group(text) to authenticated;
