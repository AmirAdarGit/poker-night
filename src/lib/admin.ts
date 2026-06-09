import { supabase } from './supabase';

// Aggregate platform stats returned by the `admin-stats` Edge Function.
// The shape mirrors the backend contract EXACTLY — do not diverge.
export interface AdminStats {
  generatedAt: string;
  users: {
    total: number;
    proCount: number;
    trialCount: number;
    activeUsers7d: number;
    signupsByDay: { date: string; count: number }[]; // last 30 days
  };
  revenue: {
    proCount: number;
    priceUsd: number;
    grossUsd: number;
    conversionPct: number;
    proUsers: { email: string | null; displayName: string; proSince: string | null }[];
  };
  games: {
    total: number;
    gamesByDay: { date: string; count: number }[];
    topHosts: { displayName: string; games: number }[];
    avgPot: number | null;
  };
  players: {
    byLocale: { locale: string; users: number }[];
    users: {
      email: string | null;
      displayName: string;
      gamesHosted: number;
      isPro: boolean;
      locale: string | null;
    }[];
  };
}

// Fetch the admin dashboard stats. The Edge Function authorizes the caller
// server-side (only admins get data); the client never trusts is_admin alone.
export async function fetchAdminStats(): Promise<
  { ok: true; stats: AdminStats } | { ok: false; error: string }
> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };

  const { data, error } = await supabase.functions.invoke('admin-stats');
  if (error) return { ok: false, error: error.message };

  const body = data as { ok?: boolean; error?: string; stats?: AdminStats } | null;
  if (!body || body.ok === false) {
    return { ok: false, error: body?.error ?? 'admin-stats-failed' };
  }
  if (!body.stats) return { ok: false, error: 'admin-stats-empty' };
  return { ok: true, stats: body.stats };
}
