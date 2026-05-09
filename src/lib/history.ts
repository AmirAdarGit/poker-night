import { supabase } from './supabase';
import type { GameState, Player } from '../types';
import { getNet, sumBuyIns } from '../types';

export interface GameHistoryEntry {
  gameId: string;
  hostId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  totalPot: number;
  playerCount: number;
  myNet: number;
  myStillIn: boolean;
  players: Player[];
}

export interface OpponentSummary {
  // Identity is by name in this model — names are free-text per game.
  displayName: string;
  gamesTogether: number;
  // My net across the games where this opponent played.
  myNetWithThem: number;
  // Their net across the same games.
  theirNet: number;
}

export interface LifetimeStats {
  gamesPlayed: number;
  totalNet: number;
  settledGamesPlayed: number;
  settledTotalNet: number;
}

// Identifies "me" in a game's state.players[] — the player whose ID matches
// my user UUID (because the host auto-adds themselves with userId = auth uid).
function findMe(players: Player[], myUserId: string): Player | undefined {
  return players.find((p) => p.id === myUserId);
}

export async function fetchMyGames(
  userId: string,
): Promise<GameHistoryEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('games')
    .select('id, host_id, state, completed_at, created_at, updated_at')
    .eq('host_id', userId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];

  return (data as Array<{
    id: string;
    host_id: string | null;
    state: GameState;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }>).map((g) => {
    const me = findMe(g.state.players, userId);
    const myNet = me ? getNet(me) : 0;
    return {
      gameId: g.id,
      hostId: g.host_id,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      completedAt: g.completed_at,
      totalPot: g.state.players.reduce((s, p) => s + sumBuyIns(p), 0),
      playerCount: g.state.players.length,
      myNet,
      myStillIn: !!me && me.cashedOut === null,
      players: g.state.players,
    };
  });
}

export function computeLifetimeStats(
  games: GameHistoryEntry[],
): LifetimeStats {
  const settled = games.filter((g) => !g.myStillIn);
  return {
    gamesPlayed: games.length,
    totalNet: games.reduce((s, g) => s + g.myNet, 0),
    settledGamesPlayed: settled.length,
    settledTotalNet: settled.reduce((s, g) => s + g.myNet, 0),
  };
}

export function computeOpponentSummaries(
  games: GameHistoryEntry[],
  myUserId: string,
): OpponentSummary[] {
  const map = new Map<string, OpponentSummary>();

  for (const g of games) {
    const me = findMe(g.players, myUserId);
    if (!me) continue;
    const myNet = getNet(me);

    for (const p of g.players) {
      if (p.id === myUserId) continue;
      // Aggregate by name — different IDs across games are expected since
      // free-text players get fresh client-side IDs each game.
      const key = p.name.trim();
      if (!key) continue;
      const existing = map.get(key);
      const theirNet = getNet(p);
      if (existing) {
        existing.gamesTogether += 1;
        existing.myNetWithThem += myNet;
        existing.theirNet += theirNet;
      } else {
        map.set(key, {
          displayName: p.name,
          gamesTogether: 1,
          myNetWithThem: myNet,
          theirNet,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.gamesTogether - a.gamesTogether);
}
