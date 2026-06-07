import { describe, expect, it } from 'vitest';
import { computeLeaderboard, type GameHistoryEntry } from './history';
import type { Player } from '../types';

function player(
  rosterId: string,
  name: string,
  buyIns: number[],
  cashedOut: number | null,
): Player {
  return { id: rosterId, rosterId, name, buyIns, cashedOut, joinedAt: 0 };
}

// Minimal entry — computeLeaderboard only reads `players`.
function game(players: Player[]): GameHistoryEntry {
  return {
    gameId: 'g',
    hostId: null,
    createdAt: '',
    updatedAt: '',
    completedAt: null,
    isActive: true,
    totalPot: 0,
    playerCount: players.length,
    players,
    topName: null,
    topNet: 0,
  };
}

describe('computeLeaderboard', () => {
  it('aggregates net across games by rosterId', () => {
    const games = [
      game([player('r1', 'אמיר', [50], 120), player('r2', 'רז', [50], 0)]),
      game([player('r1', 'אמיר', [50], 30), player('r2', 'רז', [100], 200)]),
    ];
    const board = computeLeaderboard(games);
    const amir = board.find((e) => e.key === 'r1')!;
    const raz = board.find((e) => e.key === 'r2')!;
    expect(amir.totalNet).toBe(70 + -20); // +70, -20 = +50
    expect(amir.totalNet).toBe(50);
    expect(raz.totalNet).toBe(-50 + 100); // +50
    expect(amir.gamesPlayed).toBe(2);
  });

  it('only counts settled (cashed-out) results', () => {
    const games = [
      game([player('r1', 'אמיר', [50], null), player('r2', 'רז', [50], 80)]),
    ];
    const board = computeLeaderboard(games);
    // אמיר never cashed out -> not on the board at all.
    expect(board.find((e) => e.key === 'r1')).toBeUndefined();
    expect(board.find((e) => e.key === 'r2')!.totalNet).toBe(30);
  });

  it('sorts by total net descending', () => {
    const games = [
      game([
        player('r1', 'אמיר', [50], 0), // -50
        player('r2', 'רז', [50], 150), // +100
        player('r3', 'גל', [50], 50), // 0
      ]),
    ];
    const board = computeLeaderboard(games);
    expect(board.map((e) => e.key)).toEqual(['r2', 'r3', 'r1']);
  });

  it('tracks biggest single-game win', () => {
    const games = [
      game([player('r1', 'אמיר', [50], 90)]), // +40
      game([player('r1', 'אמיר', [50], 250)]), // +200
    ];
    const amir = computeLeaderboard(games)[0]!;
    expect(amir.biggestWin).toBe(200);
  });

  it('keeps a player unified across a rename, using the most recent name', () => {
    // games arrive newest-first, so the first name seen wins.
    const games = [
      game([player('r1', 'אמיר אדר', [50], 100)]), // newer
      game([player('r1', 'אמיר', [50], 0)]), // older
    ];
    const board = computeLeaderboard(games);
    expect(board).toHaveLength(1);
    expect(board[0]!.name).toBe('אמיר אדר');
    expect(board[0]!.gamesPlayed).toBe(2);
    expect(board[0]!.totalNet).toBe(50 + -50);
  });
});
