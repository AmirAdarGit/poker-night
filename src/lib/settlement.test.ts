import { describe, expect, it } from 'vitest';
import { calculateSettlements } from './settlement';
import type { Player } from '../types';

function mkPlayer(
  name: string,
  buyIns: number[],
  cashedOut: number | null,
): Player {
  return {
    id: name.toLowerCase(),
    name,
    buyIns,
    cashedOut,
    joinedAt: 0,
  };
}

describe('calculateSettlements', () => {
  it('returns empty list when no one has cashed out', () => {
    const players = [
      mkPlayer('A', [50], null),
      mkPlayer('B', [50], null),
    ];
    expect(calculateSettlements(players)).toEqual([]);
  });

  it('returns empty list when everyone breaks even', () => {
    const players = [
      mkPlayer('A', [50], 50),
      mkPlayer('B', [50], 50),
    ];
    expect(calculateSettlements(players)).toEqual([]);
  });

  it('handles a simple two-player transfer', () => {
    const players = [
      mkPlayer('A', [50], 80),
      mkPlayer('B', [50], 20),
    ];
    expect(calculateSettlements(players)).toEqual([
      { from: 'B', to: 'A', fromId: 'b', toId: 'a', amount: 30 },
    ]);
  });

  it('uses minimal transfers (greedy match)', () => {
    // A wins 100, B wins 50. C loses 80, D loses 70.
    // Optimal: 2 transfers (A from C 80 + A from D 20 + B from D 50 = 3)
    // Greedy big-with-big: A pairs with C (80), A still needs 20 → pairs with D (20), then B with D (50). 3 transfers — equal to floor.
    // For this distribution the minimum is 3 (every creditor must be reached).
    const players = [
      mkPlayer('A', [50], 150),
      mkPlayer('B', [50], 100),
      mkPlayer('C', [50], -30),
      mkPlayer('D', [50], -20),
    ];
    const transfers = calculateSettlements(players);
    expect(transfers.length).toBeLessThanOrEqual(3);

    // Outstanding[X] = what X is still owed (+) or owes (-). Init from net.
    const balances: Record<string, number> = { A: 100, B: 50, C: -80, D: -70 };
    for (const t of transfers) {
      balances[t.from] = (balances[t.from] ?? 0) + t.amount;
      balances[t.to] = (balances[t.to] ?? 0) - t.amount;
    }
    expect(balances).toEqual({ A: 0, B: 0, C: 0, D: 0 });
  });

  it('skips players who have not cashed out', () => {
    const players = [
      mkPlayer('A', [50], 100),
      mkPlayer('B', [50], 0),
      mkPlayer('C', [50], null), // still in
    ];
    const transfers = calculateSettlements(players);
    expect(transfers).toEqual([
      { from: 'B', to: 'A', fromId: 'b', toId: 'a', amount: 50 },
    ]);
  });

  it('handles three-way exact split', () => {
    // A wins 60, B and C each lose 30
    const players = [
      mkPlayer('A', [50], 110),
      mkPlayer('B', [50], 20),
      mkPlayer('C', [50], 20),
    ];
    const transfers = calculateSettlements(players);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.to === 'A')).toBe(true);
    expect(transfers.reduce((s, t) => s + t.amount, 0)).toBe(60);
  });

  it('handles multiple buy-ins (rebuys)', () => {
    const players = [
      mkPlayer('A', [50, 50, 50], 200), // bought in 150, cashed 200, +50
      mkPlayer('B', [50], 0), // -50
    ];
    expect(calculateSettlements(players)).toEqual([
      { from: 'B', to: 'A', fromId: 'b', toId: 'a', amount: 50 },
    ]);
  });

  it('rounds fractional nets', () => {
    const players = [
      mkPlayer('A', [50], 100.4),
      mkPlayer('B', [50], -0.4 + 50),
    ];
    const transfers = calculateSettlements(players);
    // After rounding both to nearest int, A net ≈ 50, B net ≈ 0 → no transfer needed
    // But the math: A: round(50.4)=50, B: round(-0.4)=0
    expect(transfers).toEqual([]);
  });

  it('does not produce zero-amount transfers', () => {
    const players = [
      mkPlayer('A', [50], 50),
      mkPlayer('B', [50], 100),
      mkPlayer('C', [50], 0),
    ];
    const transfers = calculateSettlements(players);
    expect(transfers.every((t) => t.amount > 0)).toBe(true);
  });

  it('balances out for a realistic 5-player game', () => {
    const players = [
      mkPlayer('Amir', [50, 50], 220), // +120
      mkPlayer('Dani', [50], 10), // -40
      mkPlayer('Yossi', [50, 50, 50], 0), // -150
      mkPlayer('Tal', [50], 90), // +40
      mkPlayer('Ron', [50], 80), // +30
    ];
    const transfers = calculateSettlements(players);

    const balances: Record<string, number> = {
      Amir: 120,
      Dani: -40,
      Yossi: -150,
      Tal: 40,
      Ron: 30,
    };
    for (const t of transfers) {
      balances[t.from] = (balances[t.from] ?? 0) + t.amount;
      balances[t.to] = (balances[t.to] ?? 0) - t.amount;
    }
    expect(Object.values(balances).every((v) => v === 0)).toBe(true);
  });
});
