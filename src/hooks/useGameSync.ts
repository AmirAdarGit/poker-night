import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer, type Action } from '../reducer/gameReducer';
import {
  fetchGame,
  isSupabaseConfigured,
  supabase,
  upsertGame,
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
}

export function useGameSync(gameId: string | null): GameSync {
  const initialFromCache: GameState =
    (gameId && loadCachedGame(gameId)) || createEmptyState();

  const [state, dispatch] = useReducer(gameReducer, initialFromCache);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    gameId ? 'connecting' : 'local',
  );
  const [lastError, setLastError] = useState<string | null>(null);
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
      .then((remote) => {
        if (cancelled) return;
        if (remote) {
          dispatch({ type: 'hydrate', state: remote });
          lastPushedRef.current = JSON.stringify(remote);
        }
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
            | { state?: GameState }
            | undefined;
          const remote = row?.state;
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

  // ---- Reflect online/offline transitions in the indicator ----
  useEffect(() => {
    if (!gameId) return;
    if (!online) {
      setSyncStatus('offline');
      pendingSinceOfflineRef.current = stateRef.current;
    } else if (syncStatus === 'offline') {
      setSyncStatus('connecting');
      // Flush whatever the last local state was (last-write-wins).
      const pending = pendingSinceOfflineRef.current ?? stateRef.current;
      pendingSinceOfflineRef.current = null;
      void pushState(gameId, pending);
    }
  }, [online, gameId, syncStatus]);

  // ---- Push helper ----
  const pushState = useCallback(
    async (id: string, next: GameState) => {
      const seq = ++pushSeqRef.current;
      const result = await upsertGame(id, next);
      if (seq !== pushSeqRef.current) return; // a newer push has been issued
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

  // ---- Wrapped dispatch: optimistic update + push ----
  const wrappedDispatch = useCallback(
    (action: Action) => {
      const before = stateRef.current;
      const next = gameReducer(before, action);
      dispatch(action);

      if (!gameId) return; // setup phase, nothing to sync
      if (action.type === 'hydrate') return; // came from network
      if (next === before) return; // reducer rejected the action

      if (!online) {
        pendingSinceOfflineRef.current = next;
        return;
      }
      void pushState(gameId, next);
    },
    [gameId, online, pushState],
  );

  return { state, dispatch: wrappedDispatch, syncStatus, lastError };
}
