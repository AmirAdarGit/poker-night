// One-time Pro unlock — trial gating.
//
// The app is free until the host has created TRIAL_GAMES games OR TRIAL_DAYS
// have passed since signup, whichever comes first. After that, creating a NEW
// game is blocked until they unlock Pro (forever). Viewing/continuing existing
// games and history is always allowed.
//
// This is the single source of truth for the limits — tweak here.

export const TRIAL_GAMES = 5;
export const TRIAL_DAYS = 60; // ~2 months

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Entitlement {
  isPro: boolean;
  // True when the free trial is used up and the user is not Pro → block new games.
  locked: boolean;
  // Free games still available (0 when exhausted). Infinity-safe: clamped >= 0.
  gamesLeft: number;
  // Whole days left in the time-based trial (0 when elapsed).
  daysLeft: number;
  // Why we're showing/blocking — for copy + analytics.
  reason: 'pro' | 'games' | 'days' | 'trial';
}

export interface EntitlementInput {
  isPro: boolean;
  gamesHosted: number;
  // profiles.created_at (ISO string). Undefined → treat as just-signed-up.
  createdAt?: string | null;
}

export function computeEntitlement({
  isPro,
  gamesHosted,
  createdAt,
}: EntitlementInput): Entitlement {
  if (isPro) {
    return {
      isPro: true,
      locked: false,
      gamesLeft: Infinity,
      daysLeft: Infinity,
      reason: 'pro',
    };
  }

  const gamesLeft = Math.max(0, TRIAL_GAMES - gamesHosted);

  const signupMs = createdAt ? Date.parse(createdAt) : Date.now();
  const elapsedDays = Number.isNaN(signupMs)
    ? 0
    : Math.floor((Date.now() - signupMs) / DAY_MS);
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsedDays);

  const gamesUp = gamesLeft <= 0;
  const daysUp = daysLeft <= 0;
  const locked = gamesUp || daysUp;

  return {
    isPro: false,
    locked,
    gamesLeft,
    daysLeft,
    reason: gamesUp ? 'games' : daysUp ? 'days' : 'trial',
  };
}
