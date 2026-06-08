import { supabase } from './supabase';

// A poker group / club. The tenant boundary: roster, games, history and the
// leaderboard are all scoped to one of these.
export interface Group {
  id: string;
  name: string;
  ownerId: string | null;
  inviteCode: string;
  createdAt: string;
}

interface GroupRow {
  id: string;
  name: string;
  owner_id: string | null;
  invite_code: string;
  created_at: string;
}

function toGroup(r: GroupRow): Group {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    inviteCode: r.invite_code,
    createdAt: r.created_at,
  };
}

// Groups the current user belongs to. RLS returns only their member groups.
export async function fetchMyGroups(): Promise<Group[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, owner_id, invite_code, created_at')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as GroupRow[]).map(toGroup);
}

export async function createGroup(
  name: string,
  ownerId: string,
): Promise<{ ok: true; group: Group } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'empty-name' };
  // invite_code is filled by the gen_invite_code() column default; the
  // on_group_created trigger adds the owner as a member.
  const { data, error } = await supabase
    .from('groups')
    .insert({ name: trimmed, owner_id: ownerId })
    .select('id, name, owner_id, invite_code, created_at')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'insert-failed' };
  return { ok: true, group: toGroup(data as GroupRow) };
}

export async function joinGroupByCode(
  code: string,
): Promise<{ ok: true; group: Group } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'empty-code' };
  const { data, error } = await supabase.rpc('join_group_by_code', {
    code: trimmed,
  });
  if (error || !data) {
    const msg = error?.message ?? '';
    return {
      ok: false,
      error: msg.includes('invalid_invite_code') ? 'invalid-code' : msg || 'join-failed',
    };
  }
  // The RPC returns the single group row.
  const row = (Array.isArray(data) ? data[0] : data) as GroupRow;
  return { ok: true, group: toGroup(row) };
}

export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<boolean> {
  if (!supabase) return false;
  // Filter on user_id too: the owner's RLS could otherwise match every member
  // row in the group. This only ever removes the caller's own membership.
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  return !error;
}
