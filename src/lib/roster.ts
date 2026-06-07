import { supabase } from './supabase';

// A known player in the shared, app-wide roster (public.roster_players).
export interface RosterPlayer {
  id: string;
  name: string;
}

export async function fetchRoster(): Promise<RosterPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('roster_players')
    .select('id, name')
    .order('name', { ascending: true });
  if (error || !data) return [];
  return data as RosterPlayer[];
}

// Adds a new name to the shared roster. Returns the created row, or null on
// failure (e.g. duplicate name — the unique index rejects it).
export async function addRosterPlayer(
  name: string,
): Promise<RosterPlayer | null> {
  if (!supabase) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('roster_players')
    .insert({ name: trimmed })
    .select('id, name')
    .single();
  if (error || !data) return null;
  return data as RosterPlayer;
}
