import { supabase } from './supabase';

// Persist the user's chosen UI language to their profile. The `locale` column
// (migration-v8) is user-settable. Best-effort: failures are swallowed since the
// language change already took effect client-side via i18n + localStorage.
export async function setLocale(uid: string, code: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('profiles')
    .update({ locale: code })
    .eq('id', uid);
  if (error) console.warn('setLocale error', error);
}

// Tip-jar ("buy me a coffee") URL. Set VITE_TIP_JAR_URL in .env (falls back to
// '' → the menu item is hidden, mirroring LS_CHECKOUT_URL in pro.ts).
export const TIP_JAR_URL: string = import.meta.env.VITE_TIP_JAR_URL ?? '';
