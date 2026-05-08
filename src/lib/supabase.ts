import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GameState } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export interface GameRow {
  id: string;
  state: GameState;
  updated_at: string;
}

export async function fetchGame(id: string): Promise<GameState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('games')
    .select('state')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.warn('fetchGame error', error);
    return null;
  }
  return (data?.state as GameState | undefined) ?? null;
}

export async function upsertGame(
  id: string,
  state: GameState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const { error } = await supabase.from('games').upsert(
    {
      id,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
