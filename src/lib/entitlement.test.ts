import { describe, expect, it } from 'vitest';
import {
  computeEntitlement,
  TRIAL_DAYS,
  TRIAL_GAMES,
} from './entitlement';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString();

describe('computeEntitlement', () => {
  it('pro users are never locked', () => {
    const e = computeEntitlement({
      isPro: true,
      gamesHosted: 999,
      createdAt: daysAgo(999),
    });
    expect(e.isPro).toBe(true);
    expect(e.locked).toBe(false);
    expect(e.reason).toBe('pro');
  });

  it('fresh user is in trial, not locked', () => {
    const e = computeEntitlement({
      isPro: false,
      gamesHosted: 0,
      createdAt: daysAgo(0),
    });
    expect(e.locked).toBe(false);
    expect(e.gamesLeft).toBe(TRIAL_GAMES);
    expect(e.reason).toBe('trial');
  });

  it('locks once the game limit is reached', () => {
    const e = computeEntitlement({
      isPro: false,
      gamesHosted: TRIAL_GAMES,
      createdAt: daysAgo(1),
    });
    expect(e.locked).toBe(true);
    expect(e.gamesLeft).toBe(0);
    expect(e.reason).toBe('games');
  });

  it('locks once the trial days elapse', () => {
    const e = computeEntitlement({
      isPro: false,
      gamesHosted: 0,
      createdAt: daysAgo(TRIAL_DAYS + 1),
    });
    expect(e.locked).toBe(true);
    expect(e.daysLeft).toBe(0);
    expect(e.reason).toBe('days');
  });

  it('counts down remaining games and days', () => {
    const e = computeEntitlement({
      isPro: false,
      gamesHosted: 2,
      createdAt: daysAgo(10),
    });
    expect(e.gamesLeft).toBe(TRIAL_GAMES - 2);
    expect(e.daysLeft).toBe(TRIAL_DAYS - 10);
    expect(e.locked).toBe(false);
  });

  it('treats missing createdAt as just-signed-up', () => {
    const e = computeEntitlement({ isPro: false, gamesHosted: 0 });
    expect(e.daysLeft).toBe(TRIAL_DAYS);
    expect(e.locked).toBe(false);
  });
});
