// Supabase Edge Function: admin-stats
//
// Returns aggregate stats for the Phase 2 admin dashboard. ONLY the admin user
// (profiles.is_admin = true) may read it — this is the security boundary.
//
// Flow:
//   1. Authenticate caller from the JWT (anon client + Authorization header).
//   2. With the SERVICE ROLE (bypasses RLS), read the caller's is_admin. If not
//      true -> 403 forbidden.
//   3. With the service role, fetch all profiles + games and aggregate in JS.
//
// Secrets:
//   PRO_PRICE_USD  — optional: per-seat Pro price for revenue math (default 0).
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY are auto-injected.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 'YYYY-MM-DD' in UTC.
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
  is_pro: boolean | null;
  pro_since: string | null;
  locale: string | null;
}

interface GameRow {
  host_id: string | null;
  created_at: string | null;
  state: unknown;
}

// Sum of all buy-ins across all players for one game. Returns null if the
// state shape is unparseable so callers can exclude it from the avg.
function gamePot(state: unknown): number | null {
  if (!state || typeof state !== 'object') return null;
  const players = (state as { players?: unknown }).players;
  if (!Array.isArray(players)) return null;
  let pot = 0;
  let sawNumber = false;
  for (const p of players) {
    const buyIns = (p as { buyIns?: unknown })?.buyIns;
    if (!Array.isArray(buyIns)) continue;
    for (const b of buyIns) {
      const n = Number(b);
      if (Number.isFinite(n)) {
        pot += n;
        sawNumber = true;
      }
    }
  }
  return sawNumber ? pot : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const PRICE_USD = parseFloat(Deno.env.get('PRO_PRICE_USD') ?? '');
  const priceUsd = Number.isFinite(PRICE_USD) ? PRICE_USD : 0;

  // 1. Authenticate caller.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return json({ ok: false, error: 'not-authenticated' }, 401);
  }

  // 2. Authorize: service role read of caller's is_admin (bypasses RLS).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: me, error: meErr } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (meErr) {
    return json({ ok: false, error: 'lookup-failed' }, 500);
  }
  if (!me || me.is_admin !== true) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  // 3. Fetch all data with the service role.
  const { data: profilesData, error: profErr } = await admin
    .from('profiles')
    .select('id, email, display_name, created_at, is_pro, pro_since, locale');
  if (profErr) {
    return json({ ok: false, error: 'fetch-failed' }, 500);
  }
  const { data: gamesData, error: gamesErr } = await admin
    .from('games')
    .select('host_id, created_at, state');
  if (gamesErr) {
    return json({ ok: false, error: 'fetch-failed' }, 500);
  }

  const profiles = (profilesData ?? []) as ProfileRow[];
  const games = (gamesData ?? []) as GameRow[];

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // ---- users -------------------------------------------------------------
  const total = profiles.length;
  const proCount = profiles.filter((p) => p.is_pro === true).length;
  const trialCount = total - proCount;

  // distinct host_id among games created in the last 7 days
  const active = new Set<string>();
  for (const g of games) {
    if (!g.host_id || !g.created_at) continue;
    if (new Date(g.created_at).getTime() >= sevenDaysAgo) active.add(g.host_id);
  }
  const activeUsers7d = active.size;

  // last 30 calendar days, zero-filled, oldest -> newest.
  const dayOrder: string[] = [];
  const signupCounts: Record<string, number> = {};
  const gameCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    dayOrder.push(key);
    signupCounts[key] = 0;
    gameCounts[key] = 0;
  }
  for (const p of profiles) {
    if (!p.created_at) continue;
    const key = dayKey(new Date(p.created_at));
    if (key in signupCounts) signupCounts[key] += 1;
  }
  for (const g of games) {
    if (!g.created_at) continue;
    const key = dayKey(new Date(g.created_at));
    if (key in gameCounts) gameCounts[key] += 1;
  }
  const signupsByDay = dayOrder.map((date) => ({
    date,
    count: signupCounts[date],
  }));
  const gamesByDay = dayOrder.map((date) => ({ date, count: gameCounts[date] }));

  // ---- revenue -----------------------------------------------------------
  const grossUsd = proCount * priceUsd;
  const conversionPct =
    total > 0 ? Math.round((proCount / total) * 1000) / 10 : 0;
  const proUsers = profiles
    .filter((p) => p.is_pro === true)
    .sort((a, b) => {
      const ta = a.pro_since ? new Date(a.pro_since).getTime() : 0;
      const tb = b.pro_since ? new Date(b.pro_since).getTime() : 0;
      return tb - ta; // desc
    })
    .map((p) => ({
      email: p.email ?? null,
      displayName: p.display_name ?? '',
      proSince: p.pro_since ?? null,
    }));

  // ---- games -------------------------------------------------------------
  const gamesTotal = games.length;

  const nameById = new Map<string, string>();
  for (const p of profiles) nameById.set(p.id, p.display_name ?? '');

  const hostCounts = new Map<string, number>();
  for (const g of games) {
    if (!g.host_id) continue;
    hostCounts.set(g.host_id, (hostCounts.get(g.host_id) ?? 0) + 1);
  }
  const topHosts = [...hostCounts.entries()]
    .map(([id, count]) => ({
      displayName: nameById.get(id) ?? '',
      games: count,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);

  let potSum = 0;
  let potGames = 0;
  for (const g of games) {
    const pot = gamePot(g.state);
    if (pot !== null) {
      potSum += pot;
      potGames += 1;
    }
  }
  const avgPot = potGames > 0 ? potSum / potGames : null;

  // ---- players -----------------------------------------------------------
  const localeCounts = new Map<string, number>();
  for (const p of profiles) {
    const loc = p.locale ?? 'unknown';
    localeCounts.set(loc, (localeCounts.get(loc) ?? 0) + 1);
  }
  const byLocale = [...localeCounts.entries()]
    .map(([locale, users]) => ({ locale, users }))
    .sort((a, b) => b.users - a.users);

  const users = profiles
    .map((p) => ({
      email: p.email ?? null,
      displayName: p.display_name ?? '',
      gamesHosted: hostCounts.get(p.id) ?? 0,
      isPro: p.is_pro === true,
      locale: p.locale ?? null,
    }))
    .sort((a, b) => b.gamesHosted - a.gamesHosted);

  return json({
    ok: true,
    stats: {
      generatedAt: new Date().toISOString(),
      users: {
        total,
        proCount,
        trialCount,
        activeUsers7d,
        signupsByDay,
      },
      revenue: {
        proCount,
        priceUsd,
        grossUsd,
        conversionPct,
        proUsers,
      },
      games: {
        total: gamesTotal,
        gamesByDay,
        topHosts,
        avgPot,
      },
      players: {
        byLocale,
        users,
      },
    },
  });
});
