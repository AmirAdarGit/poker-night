import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer, type Action } from '../reducer/gameReducer';
import {
  fetchGame,
  isSupabaseConfigured,
  supabase,
  syncGamePlayers,
  updateGameState,
} from '../lib/supabase';
import { loadCachedGame, saveCachedGame } from '../lib/storage';
import { createEmptyState, type GameState } from '../types';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuth } from '../contexts/AuthContext';

export type SyncStatus =
  | 'local' // no game ID yet (setup before start)
  | 'connecting'
  | 'live'
  | 'offline'
  | 'error';

export interface GameSync {
  state: GameState;
  dispatch: (action: Action) => void;
  syncStatus: SyncStatus;
  lastError: string | null;
  hostId: string | null;
  isHost: boolean;
}

const NON_LOCAL_ACTIONS = new Set<Action['type']>([
  'add-player',
  'remove-player',
  'add-buy-in',
  'cash-out',
  'undo-cash-out',
  'start-game',
  'go-to-settlement',
  'back-to-playing',
]);

export function useGameSync(gameId: string | null): GameSync {
  const initialFromCache: GameState =
    (gameId && loadCachedGame(gameId)) || createEmptyState();

  const [state, dispatch] = useReducer(gameReducer, initialFromCache);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    gameId ? 'connecting' : 'local',
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const online = useOnlineStatus();
  const { user } = useAuth();

  const isHost = !gameId || (!!user && !!hostId && user.id === hostId);

  const stateRef = useRef(state);
  stateRef.current = state;

  const pushSeqRef = useRef(0);
  const lastPushedRef = useRef<string>('');
  const lastSyncedPlayerIdsRef = useRef<string>('');
  const pendingSinceOfflineRef = useRef<GameState | null>(null);

  // ---- Cache to localStorage ----
  useEffect(() => {
    if (gameId) saveCachedGame(gameId, state);
  }, [gameId, state]);

  // ---- Initial fetch + realtime subscription ----
  useEffect(() => {
    if (!gameId) {
      setSyncStatus('local');
      setHostId(null);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus('error');
      setLastError('Supabase לא מוגדר');
      return;
    }

    let cancelled = false;
    setSyncStatus(online ? 'connecting' : 'offline');

    fetchGame(gameId)
      .then((row) => {
        if (cancelled || !row) return;
        dispatch({ type: 'hydrate', state: row.state });
        setHostId(row.host_id);
        lastPushedRef.current = JSON.stringify(row.state);
        if (online) setSyncStatus('live');
      })
      .catch(() => {
        if (cancelled) return;
        setSyncStatus(online ? 'error' : 'offline');
      });

    const client = supabase;
    if (!client) return;

    const channel = client
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { state?: GameState; host_id?: string | null }
            | undefined;
          if (!row) return;
          if (row.host_id !== undefined) setHostId(row.host_id ?? null);
          const remote = row.state;
          if (!remote) return;
          const remoteJson = JSON.stringify(remote);
          if (remoteJson === lastPushedRef.current) return;
          if (remoteJson === JSON.stringify(stateRef.current)) return;
          lastPushedRef.current = remoteJson;
          dispatch({ type: 'hydrate', state: remote });
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (online) setSyncStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncStatus(online ? 'error' : 'offline');
        }
      });

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [gameId, online]);

  // ---- Reflect online/offline transitions ----
  useEffect(() => {
    if (!gameId) return;
    if (!online) {
      setSyncStatus('offline');
      pendingSinceOfflineRef.current = stateRef.current;
    } else if (syncStatus === 'offline') {
      setSyncStatus('connecting');
      const pending = pendingSinceOfflineRef.current ?? stateRef.current;
      pendingSinceOfflineRef.current = null;
      if (isHost) void pushState(gameId, pending);
    }
  }, [online, gameId, syncStatus, isHost]);

  const pushState = useCallback(
    async (id: string, next: GameState) => {
      const seq = ++pushSeqRef.current;
      const result = await updateGameState(id, next);
      if (seq !== pushSeqRef.current) return;
      if (result.ok) {
        lastPushedRef.current = JSON.stringify(next);
        setLastError(null);
        if (online) setSyncStatus('live');

        // Keep game_players link table in sync with the player roster.
        const playerIds = next.players.map((p) => p.id).sort();
        const playerIdsKey = playerIds.join(',');
        if (playerIdsKey !== lastSyncedPlayerIdsRef.current) {
          lastSyncedPlayerIdsRef.current = playerIdsKey;
          void syncGamePlayers(id, playerIds);
        }
      } else {
        setLastError(result.error);
        setSyncStatus(online ? 'error' : 'offline');
      }
    },
    [online],
  );

  const wrappedDispatch = useCallback(
    (action: Action) => {
      // Block non-local mutating actions for non-hosts on a synced game.
      if (
        gameId &&
        hostId &&
        !isHost &&
        NON_LOCAL_ACTIONS.has(action.type)
      ) {
        return;
      }

      const before = stateRef.current;
      const next = gameReducer(before, action);
      dispatch(action);

      if (!gameId) return;
      if (action.type === 'hydrate') return;
      if (action.type === 'reset') return;
      if (next === before) return;

      if (!online) {
        pendingSinceOfflineRef.current = next;
        return;
      }
      void pushState(gameId, next);
    },
    [gameId, hostId, isHost, online, pushState],
  );

  return {
    state,
    dispatch: wrappedDispatch,
    syncStatus,
    lastError,
    hostId,
    isHost,
  };
}
