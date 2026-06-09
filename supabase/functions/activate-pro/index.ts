// Supabase Edge Function: activate-pro
//
// Redeems a Lemon Squeezy license key and unlocks Pro for the calling user.
//
// Flow:
//   1. Authenticate caller from the JWT (anon client + Authorization header).
//   2. Activate the license key with Lemon Squeezy, binding it to the user id
//      (instance_name = uid). LS enforces the per-key activation limit, so one
//      key can't unlock many accounts.
//   3. With the SERVICE ROLE (bypasses RLS + the guard_profile_pro trigger),
//      set profiles.is_pro = true, pro_since = now() for that user.
//
// Secrets (set with `supabase secrets set ...`):
//   LEMONSQUEEZY_API_KEY      — LS API key (server-only, never shipped to client)
//   LEMONSQUEEZY_PRODUCT_ID   — optional: reject keys for other products
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

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
  const LS_API_KEY = Deno.env.get('LEMONSQUEEZY_API_KEY');
  const LS_PRODUCT_ID = Deno.env.get('LEMONSQUEEZY_PRODUCT_ID');

  if (!LS_API_KEY) {
    return json({ ok: false, error: 'not-configured' }, 500);
  }

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

  // Parse body.
  let licenseKey = '';
  try {
    const body = await req.json();
    licenseKey = String(body.licenseKey ?? '').trim();
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }
  if (!licenseKey) {
    return json({ ok: false, error: 'empty-key' }, 400);
  }

  // 2. Activate the license with Lemon Squeezy, bound to this user.
  const lsRes = await fetch(
    'https://api.lemonsqueezy.com/v1/licenses/activate',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${LS_API_KEY}`,
      },
      body: new URLSearchParams({
        license_key: licenseKey,
        instance_name: user.id,
      }),
    },
  );
  const ls = await lsRes.json().catch(() => null);

  // `activated` true means it just bound; a key already activated to THIS user
  // is also fine (idempotent re-activation returns an error but valid license).
  const activated = ls?.activated === true;
  const validLicense = ls?.license_key?.status === 'active' || activated;
  if (!lsRes.ok || !validLicense) {
    return json({ ok: false, error: 'invalid-key' }, 200);
  }

  // Optional: reject keys belonging to a different product.
  if (
    LS_PRODUCT_ID &&
    ls?.meta?.product_id != null &&
    String(ls.meta.product_id) !== String(LS_PRODUCT_ID)
  ) {
    return json({ ok: false, error: 'wrong-product' }, 200);
  }

  // 3. Flip is_pro with the service role (bypasses RLS + guard trigger).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { error: updErr } = await admin
    .from('profiles')
    .update({ is_pro: true, pro_since: new Date().toISOString() })
    .eq('id', user.id);
  if (updErr) {
    return json({ ok: false, error: 'update-failed' }, 500);
  }

  return json({ ok: true });
});
