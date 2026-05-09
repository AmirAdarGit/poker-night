import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GameState } from '../types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // PKCE keeps OAuth code-exchange state on the app's own origin,
          // so Chrome's bounce-tracking mitigations don't wipe it
          // mid-flow. Required for reliable Google sign-in in Chrome.
          flowType: 'pkce',
        },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export interface GameRow {
  id: string;
  host_id: string | null;
  state: GameState;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchGame(
  id: string,
): Promise<{ state: GameState; host_id: string | null } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('games')
    .select('state, host_id')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.warn('fetchGame error', error);
    return null;
  }
  if (!data) return null;
  return {
    state: data.state as GameState,
    host_id: (data.host_id as string | null) ?? null,
  };
}

export async function createGame(
  id: string,
  hostId: string,
  state: GameState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const { error } = await supabase.from('games').insert({
    id,
    host_id: hostId,
    state,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateGameState(
  id: string,
  state: GameState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const { error } = await supabase
    .from('games')
    .update({ state })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

