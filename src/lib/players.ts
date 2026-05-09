import { supabase } from './supabase';
import type { Profile } from '../types';

export async function lookupProfileByEmail(
  email: string,
): Promise<Profile | null> {
  if (!supabase) return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .ilike('email', trimmed)
    .maybeSingle();
  if (error) {
    console.warn('lookupProfileByEmail error', error);
    return null;
  }
  return (data as Profile | null) ?? null;
}

// Profiles I've played with at least once, sorted by recency.
export async function fetchRecentCoPlayers(
  userId: string,
  limit = 30,
): Promise<Profile[]> {
  if (!supabase) return [];

  const { data: myGames, error: e1 } = await supabase
    .from('game_players')
    .select('game_id, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(100);
  if (e1 || !myGames || myGames.length === 0) return [];

  const gameIds = myGames.map((r: { game_id: string }) => r.game_id);

  const { data: coplayers, error: e2 } = await supabase
    .from('game_players')
    .select('user_id, joined_at, game_id')
    .in('game_id', gameIds);
  if (e2 || !coplayers) return [];

  // Take the most recent joined_at per other user.
  const latestSeen = new Map<string, number>();
  for (const row of coplayers as {
    user_id: string;
    joined_at: string;
  }[]) {
    if (row.user_id === userId) continue;
    const ts = new Date(row.joined_at).getTime();
    const prev = latestSeen.get(row.user_id) ?? 0;
    if (ts > prev) latestSeen.set(row.user_id, ts);
  }

  if (latestSeen.size === 0) return [];

  const otherIds = [...latestSeen.keys()];
  const { data: profiles, error: e3 } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', otherIds);
  if (e3 || !profiles) return [];

  return (profiles as Profile[])
    .map((p) => ({ p, ts: latestSeen.get(p.id) ?? 0 }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
    .map(({ p }) => p);
}
