import { supabase } from './supabase';
import type { GameState, Player } from '../types';
import { getNet, playerKey, sumBuyIns } from '../types';

export interface GameHistoryEntry {
  gameId: string;
  hostId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  // Convenience flag: a game with no completedAt is still open / returnable.
  isActive: boolean;
  totalPot: number;
  playerCount: number;
  players: Player[];
  // Best result in the game (for the finished-games list). Null if nobody
  // has cashed out yet.
  topName: string | null;
  topNet: number;
}

// One row of the all-time leaderboard, aggregated across every game by the
// player's stable identity (rosterId), so renames never split a player.
export interface LeaderboardEntry {
  key: string;
  name: string;
  // Number of settled appearances (games where this player cashed out).
  gamesPlayed: number;
  totalNet: number;
  biggestWin: number;
  totalBuyIn: number;
}

function toEntry(row: {
  id: string;
  host_id: string | null;
  state: GameState;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}): GameHistoryEntry {
  const players = row.state.players;
  let topName: string | null = null;
  let topNet = 0;
  for (const p of players) {
    if (p.cashedOut == null) continue;
    const net = getNet(p);
    if (topName === null || net > topNet) {
      topName = p.name;
      topNet = net;
    }
  }
  return {
    gameId: row.id,
    hostId: row.host_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    isActive: row.completed_at == null,
    totalPot: players.reduce((s, p) => s + sumBuyIns(p), 0),
    playerCount: players.length,
    players,
    topName,
    topNet,
  };
}

// All games in a group, newest-touched first. RLS already restricts rows to
// the user's member groups; the explicit group_id filter keeps a multi-group
// user's history scoped to the active group only.
export async function fetchAllGames(
  groupId: string | null,
): Promise<GameHistoryEntry[]> {
  if (!supabase || !groupId) return [];
  const { data, error } = await supabase
    .from('games')
    .select('id, host_id, state, completed_at, created_at, updated_at')
    .eq('group_id', groupId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return (data as Parameters<typeof toEntry>[0][]).map(toEntry);
}

export function computeLeaderboard(
  games: GameHistoryEntry[],
): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  // games arrive newest-first, so the first name we see for a player is their
  // most recent one — keep it and don't overwrite with older snapshots.
  for (const g of games) {
    for (const p of g.players) {
      if (p.cashedOut == null) continue; // unsettled results don't count
      const key = playerKey(p);
      const net = getNet(p);
      const buyIn = sumBuyIns(p);
      const e = map.get(key);
      if (e) {
        e.gamesPlayed += 1;
        e.totalNet += net;
        e.totalBuyIn += buyIn;
        e.biggestWin = Math.max(e.biggestWin, net);
      } else {
        map.set(key, {
          key,
          name: p.name,
          gamesPlayed: 1,
          totalNet: net,
          biggestWin: net,
          totalBuyIn: buyIn,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.totalNet - a.totalNet);
}
