import { supabase } from './supabase';

// A known player in a group's roster (public.roster_players, scoped by group).
export interface RosterPlayer {
  id: string;
  name: string;
}

export async function fetchRoster(
  groupId: string | null,
): Promise<RosterPlayer[]> {
  if (!supabase || !groupId) return [];
  const { data, error } = await supabase
    .from('roster_players')
    .select('id, name')
    .eq('group_id', groupId)
    .order('name', { ascending: true });
  if (error || !data) return [];
  return data as RosterPlayer[];
}

// Adds a new name to the group's roster. Returns the created row, or null on
// failure (e.g. duplicate name within the group — the unique index rejects it).
export async function addRosterPlayer(
  groupId: string | null,
  name: string,
): Promise<RosterPlayer | null> {
  if (!supabase || !groupId) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('roster_players')
    .insert({ group_id: groupId, name: trimmed })
    .select('id, name')
    .single();
  if (error || !data) return null;
  return data as RosterPlayer;
}
