import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import i18n from '../i18n';
import { gameReducer, type Action } from '../reducer/gameReducer';
import {
  fetchGame,
  isSupabaseConfigured,
  setGameCompleted,
  supabase,
  updateGameState,
} from '../lib/supabase';
import { loadCachedGame, saveCachedGame } from '../lib/storage';
import { createEmptyState, type GameState } from '../types';
import { useOnlineStatus } from './useOnlineStatus';

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
  // ISO timestamp when the game was closed, or null while it's still active.
  completedAt: string | null;
  // Close the game for everyone (host or any shared player may call it).
  closeGame: () => Promise<void>;
  // Re-open a closed game so it can be edited / returned to active.
  reopenGame: () => Promise<void>;
}

export function useGameSync(gameId: string | null): GameSync {
  const initialFromCache: GameState =
    (gameId && loadCachedGame(gameId)) || createEmptyState();

  const [state, dispatch] = useReducer(gameReducer, initialFromCache);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    gameId ? 'connecting' : 'local',
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const online = useOnlineStatus();

  const stateRef = useRef(state);
  stateRef.current = state;

  const pushSeqRef = useRef(0);
  const lastPushedRef = useRef<string>('');
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
      setCompletedAt(null);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus('error');
      setLastError(i18n.t('sync.notConfigured'));
      return;
    }

    let cancelled = false;
    setSyncStatus(online ? 'connecting' : 'offline');

    fetchGame(gameId)
      .then((row) => {
        if (cancelled || !row) return;
        dispatch({ type: 'hydrate', state: row.state });
        setHostId(row.host_id);
        setCompletedAt(row.completed_at);
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
            | {
                state?: GameState;
                host_id?: string | null;
                completed_at?: string | null;
              }
            | undefined;
          if (!row) return;
          if (row.host_id !== undefined) setHostId(row.host_id ?? null);
          if (row.completed_at !== undefined)
            setCompletedAt(row.completed_at ?? null);
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

  const pushState = useCallback(
    async (id: string, next: GameState) => {
      const seq = ++pushSeqRef.current;
      const result = await updateGameState(id, next);
      if (seq !== pushSeqRef.current) return;
      if (result.ok) {
        lastPushedRef.current = JSON.stringify(next);
        setLastError(null);
        if (online) setSyncStatus('live');
      } else {
        setLastError(result.error);
        setSyncStatus(online ? 'error' : 'offline');
      }
    },
    [online],
  );

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
      void pushState(gameId, pending);
    }
  }, [online, gameId, syncStatus, pushState]);

  const setCompleted = useCallback(
    async (completed: boolean) => {
      if (!gameId) return;
      // Optimistic — realtime will confirm and re-broadcast to other devices.
      setCompletedAt(completed ? new Date().toISOString() : null);
      const result = await setGameCompleted(gameId, completed);
      if (!result.ok) setLastError(result.error);
    },
    [gameId],
  );

  const closeGame = useCallback(() => setCompleted(true), [setCompleted]);
  const reopenGame = useCallback(() => setCompleted(false), [setCompleted]);

  const wrappedDispatch = useCallback(
    (action: Action) => {
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
    [gameId, online, pushState],
  );

  return {
    state,
    dispatch: wrappedDispatch,
    syncStatus,
    lastError,
    hostId,
    completedAt,
    closeGame,
    reopenGame,
  };
}
