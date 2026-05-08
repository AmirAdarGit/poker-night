import type { GameState } from '../types';

const PREFIX = 'poker-night:game:';

export function loadCachedGame(gameId: string): GameState | null {
  try {
    const raw = localStorage.getItem(PREFIX + gameId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || !Array.isArray(parsed.players) || !parsed.phase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedGame(gameId: string, state: GameState): void {
  try {
    localStorage.setItem(PREFIX + gameId, JSON.stringify(state));
  } catch {
    // Quota / privacy mode — ignore
  }
}

export function clearCachedGame(gameId: string): void {
  try {
    localStorage.removeItem(PREFIX + gameId);
  } catch {
    // ignore
  }
}
