import { describe, expect, it } from 'vitest';
import { gameReducer } from './gameReducer';
import { createEmptyState, type GameState } from '../types';

function setup(): GameState {
  return createEmptyState();
}

describe('gameReducer — roster players', () => {
  it('adds a roster player using rosterId as the in-game id', () => {
    const s = gameReducer(setup(), {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: 50,
    });
    expect(s.players).toHaveLength(1);
    const p = s.players[0]!;
    expect(p.id).toBe('r1');
    expect(p.rosterId).toBe('r1');
    expect(p.buyIns).toEqual([50]);
    expect(p.cashedOut).toBeNull();
  });

  it('rejects adding the same roster player twice', () => {
    let s = gameReducer(setup(), {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: 50,
    });
    s = gameReducer(s, {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: 100,
    });
    expect(s.players).toHaveLength(1);
    expect(s.players[0]!.buyIns).toEqual([50]);
  });

  it('allows two free-text players that share a name (distinct ids)', () => {
    let s = gameReducer(setup(), {
      type: 'add-player',
      name: 'גל',
      initialBuyIn: 50,
    });
    s = gameReducer(s, { type: 'add-player', name: 'גל', initialBuyIn: 50 });
    expect(s.players).toHaveLength(2);
    expect(s.players[0]!.id).not.toBe(s.players[1]!.id);
    expect(s.players[0]!.rosterId).toBeUndefined();
  });

  it('rounds and floors a negative initial buy-in to zero', () => {
    const s = gameReducer(setup(), {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: -20,
    });
    expect(s.players[0]!.buyIns).toEqual([0]);
  });
});

describe('gameReducer — set-initial-buy-in', () => {
  it('replaces the single setup buy-in', () => {
    let s = gameReducer(setup(), {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: 50,
    });
    s = gameReducer(s, { type: 'set-initial-buy-in', id: 'r1', amount: 120 });
    expect(s.players[0]!.buyIns).toEqual([120]);
  });

  it('ignores an unknown player id', () => {
    const before = gameReducer(setup(), {
      type: 'add-player',
      rosterId: 'r1',
      name: 'אמיר',
      initialBuyIn: 50,
    });
    const after = gameReducer(before, {
      type: 'set-initial-buy-in',
      id: 'nope',
      amount: 999,
    });
    expect(after.players).toEqual(before.players);
  });
});
