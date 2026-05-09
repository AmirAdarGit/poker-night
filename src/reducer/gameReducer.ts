import type { GameState, Player } from '../types';

export type Action =
  | {
      type: 'add-player';
      userId: string;
      name: string;
      initialBuyIn: number;
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
      if (!trimmed || !action.userId) return state;
      // Reject duplicates: a user can only be in a game once.
      if (state.players.some((p) => p.id === action.userId)) return state;
      const player: Player = {
        id: action.userId,
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
