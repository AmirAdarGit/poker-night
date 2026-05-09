import type { GameState, Player } from '../types';
import { generatePlayerId } from '../lib/gameId';

export type Action =
  | {
      type: 'add-player';
      name: string;
      initialBuyIn: number;
      // Optional — used when the host auto-adds themselves so we know to
      // map this player back to their account for history aggregation.
      userId?: string;
    }
  | { type: 'remove-player'; id: string }
  | { type: 'add-buy-in'; id: string; amount: number }
  | { type: 'cash-out'; id: string; amount: number }
  | { type: 'undo-cash-out'; id: string }
  | { type: 'start-game' }
  | { type: 'go-to-settlement' }
  | { type: 'back-to-playing' }
  | { type: 'reset' }
  | { type: 'hydrate'; state: GameState };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'add-player': {
      const trimmed = action.name.trim();
      if (!trimmed) return state;
      // If a userId is provided (host auto-add), use it as the player ID and
      // reject duplicates by user. Otherwise generate a fresh ID — duplicate
      // names are allowed because two friends might share a first name.
      const id = action.userId ?? generatePlayerId();
      if (action.userId && state.players.some((p) => p.id === id)) {
        return state;
      }
      const player: Player = {
        id,
        name: trimmed,
        buyIns: [Math.max(0, Math.round(action.initialBuyIn))],
        cashedOut: null,
        joinedAt: Date.now(),
      };
      return { ...state, players: [...state.players, player] };
    }

    case 'remove-player': {
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      };
    }

    case 'add-buy-in': {
      const amount = Math.max(0, Math.round(action.amount));
      if (amount === 0) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id
            ? { ...p, buyIns: [...p.buyIns, amount], cashedOut: null }
            : p,
        ),
      };
    }

    case 'cash-out': {
      const amount = Math.max(0, Math.round(action.amount));
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, cashedOut: amount } : p,
        ),
      };
    }

    case 'undo-cash-out': {
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, cashedOut: null } : p,
        ),
      };
    }

    case 'start-game': {
      if (state.players.length < 2) return state;
      return { ...state, phase: 'playing' };
    }

    case 'go-to-settlement': {
      const anyCashedOut = state.players.some((p) => p.cashedOut !== null);
      if (!anyCashedOut) return state;
      return { ...state, phase: 'settlement' };
    }

    case 'back-to-playing': {
      return { ...state, phase: 'playing' };
    }

    case 'reset': {
      return { phase: 'setup', players: [] };
    }

    case 'hydrate': {
      return action.state;
    }
  }
}
