// Supabase Edge Function: admin-delete-game
//
// Lets the admin (profiles.is_admin = true) permanently delete ANY game,
// across all users/groups. Normal RLS only allows a host to delete their own
// games, so this uses the SERVICE ROLE to bypass it — gated behind an is_admin
// check, which is the security boundary.
//
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

  // 2. Authorize: service-role read of caller's is_admin (bypasses RLS).
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

  // Parse body.
  let gameId = '';
  try {
    const body = await req.json();
    gameId = String(body.gameId ?? '').trim();
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }
  if (!gameId) {
    return json({ ok: false, error: 'empty-game-id' }, 400);
  }

  // 3. Delete with the service role (bypasses the host-only RLS policy).
  const { error: delErr } = await admin
    .from('games')
    .delete()
    .eq('id', gameId);
  if (delErr) {
    return json({ ok: false, error: 'delete-failed' }, 500);
  }

  return json({ ok: true });
});
