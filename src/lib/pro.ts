import { supabase } from './supabase';

// Number of games this user has hosted — drives the free-trial game count.
export async function countGamesHosted(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', userId);
  if (error) {
    console.warn('countGamesHosted error', error);
    return 0;
  }
  return count ?? 0;
}

// Redeem a Lemon Squeezy license key → unlock Pro forever.
// The activate-pro Edge Function validates the key server-side (LS API key is
// never exposed to the client) and flips profiles.is_pro via the service role.
export async function activatePro(
  licenseKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'supabase-not-configured' };
  const key = licenseKey.trim();
  if (!key) return { ok: false, error: 'empty-key' };

  const { data, error } = await supabase.functions.invoke('activate-pro', {
    body: { licenseKey: key },
  });
  if (error) return { ok: false, error: error.message };
  if (data && (data as { ok?: boolean }).ok === false) {
    return { ok: false, error: (data as { error?: string }).error ?? 'invalid-key' };
  }
  return { ok: true };
}

// Lemon Squeezy hosted-checkout URL for the one-time Pro product.
// Set VITE_LS_CHECKOUT_URL in .env (falls back to '' → Buy button hidden).
export const LS_CHECKOUT_URL: string =
  import.meta.env.VITE_LS_CHECKOUT_URL ?? '';
