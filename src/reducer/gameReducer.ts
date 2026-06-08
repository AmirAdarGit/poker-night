import type { GameState, Player } from '../types';
import { generatePlayerId } from '../lib/gameId';

export type Action =
  | {
      type: 'add-player';
      name: string;
      initialBuyIn: number;
      // Stable cross-game identity (roster_players.id). When present it also
      // becomes the in-game player id, so the same friend can't be added twice.
      rosterId?: string;
      // Optional — legacy host auto-add path; maps the player to their account.
      userId?: string;
    }
  | { type: 'remove-player'; id: string }
  | { type: 'set-player-name'; id: string; name: string }
  | { type: 'set-initial-buy-in'; id: string; amount: number }
  | { type: 'set-player-phone'; id: string; phone: string }
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
      // Roster pick (or legacy host auto-add) uses the stable id as the in-game
      // id and rejects duplicates. Free-text players get a fresh id — duplicate
      // names are allowed because two friends might share a first name.
      const stableId = action.rosterId ?? action.userId;
      const id = stableId ?? generatePlayerId();
      if (stableId && state.players.some((p) => p.id === id)) {
        return state;
      }
      const player: Player = {
        id,
        rosterId: action.rosterId,
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

    case 'set-player-name': {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, name } : p,
        ),
      };
    }

    case 'set-initial-buy-in': {
      // Setup-phase only: a player has exactly one buy-in before the game
      // starts. Editing it replaces that single entry.
      const amount = Math.max(0, Math.round(action.amount));
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, buyIns: [amount] } : p,
        ),
      };
    }

    case 'set-player-phone': {
      const phone = action.phone.trim();
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, phone: phone || undefined } : p,
        ),
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
