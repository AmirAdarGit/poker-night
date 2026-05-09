import { supabase } from './supabase';
import type { GameState, Player, Profile } from '../types';
import { getNet, sumBuyIns } from '../types';

export interface GameHistoryEntry {
  gameId: string;
  hostId: string | null;
  hostName: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  totalPot: number;
  playerCount: number;
  myNet: number; // 0 if I haven't cashed out yet in this game
  myStillIn: boolean;
  players: Player[];
}

export interface OpponentSummary {
  userId: string;
  displayName: string;
  gamesTogether: number;
  // My total net across all games where this opponent also played.
  myNetWithThem: number;
  // Their total net across the same games.
  theirNet: number;
}

export interface LifetimeStats {
  gamesPlayed: number;
  totalNet: number;
  // My net only across games where I cashed out.
  settledGamesPlayed: number;
  settledTotalNet: number;
}

export async function fetchMyGames(
  userId: string,
): Promise<GameHistoryEntry[]> {
  if (!supabase) return [];

  const { data: links, error: e1 } = await supabase
    .from('game_players')
    .select('game_id')
    .eq('user_id', userId);
  if (e1 || !links || links.length === 0) return [];

  const gameIds = links.map((r: { game_id: string }) => r.game_id);

  const { data: games, error: e2 } = await supabase
    .from('games')
    .select(
      'id, host_id, state, completed_at, created_at, updated_at',
    )
    .in('id', gameIds)
    .order('updated_at', { ascending: false });
  if (e2 || !games) return [];

  // Resolve host display names in one batch.
  const hostIds = [
    ...new Set(
      (games as { host_id: string | null }[])
        .map((g) => g.host_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const hostNameMap = new Map<string, string>();
  if (hostIds.length > 0) {
    const { data: hostProfiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', hostIds);
    if (hostProfiles) {
      for (const p of hostProfiles as Profile[]) {
        hostNameMap.set(p.id, p.display_name);
      }
    }
  }

  return (games as Array<{
    id: string;
    host_id: string | null;
    state: GameState;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }>).map((g) => {
    const me = g.state.players.find((p) => p.id === userId);
    const myNet = me ? getNet(me) : 0;
    return {
      gameId: g.id,
      hostId: g.host_id,
      hostName: g.host_id ? (hostNameMap.get(g.host_id) ?? null) : null,
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
    const me = g.players.find((p) => p.id === myUserId);
    if (!me) continue;
    const myNet = getNet(me);

    for (const p of g.players) {
      if (p.id === myUserId) continue;
      const existing = map.get(p.id);
      const theirNet = getNet(p);
      if (existing) {
        existing.gamesTogether += 1;
        existing.myNetWithThem += myNet;
        existing.theirNet += theirNet;
      } else {
        map.set(p.id, {
          userId: p.id,
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
