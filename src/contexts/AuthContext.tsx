import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { countGamesHosted } from '../lib/pro';
import { computeEntitlement, type Entitlement } from '../lib/entitlement';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setDisplayName: (
    displayName: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  // Number of games this user has hosted (drives the free-trial game count).
  gamesHosted: number;
  // Trial/Pro state, derived from profile + gamesHosted. Null until loaded.
  entitlement: Entitlement | null;
  // Whether the signed-in user is an admin (gates the admin dashboard).
  isAdmin: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gamesHosted, setGamesHosted] = useState(0);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return null;
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, created_at, is_pro, pro_since, is_admin, locale')
      .eq('id', uid)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  }, []);

  // Load profile + hosted-game count together (both feed entitlement).
  const loadUser = useCallback(
    async (uid: string) => {
      const [p, n] = await Promise.all([loadProfile(uid), countGamesHosted(uid)]);
      return { profile: p, gamesHosted: n };
    },
    [loadProfile],
  );

  // Initial session + subscribe to changes.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        loadUser(data.session.user.id).then((r) => {
          if (cancelled) return;
          setProfile(r.profile);
          setGamesHosted(r.gamesHosted);
        });
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadUser(s.user.id).then((r) => {
          setProfile(r.profile);
          setGamesHosted(r.gamesHosted);
        });
      } else {
        setProfile(null);
        setGamesHosted(0);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { ok: false, error: 'supabase-not-configured' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.search },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { ok: false, error: 'supabase-not-configured' };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) return { ok: false, error: 'supabase-not-configured' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const setDisplayName = useCallback(
    async (displayName: string) => {
      if (!supabase || !user) return { ok: false, error: 'not-signed-in' };
      const trimmed = displayName.trim();
      if (!trimmed) return { ok: false, error: 'empty-name' };
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, display_name: trimmed, email: user.email });
      if (error) return { ok: false, error: error.message };
      const fresh = await loadProfile(user.id);
      setProfile(fresh);
      return { ok: true };
    },
    [user, loadProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const r = await loadUser(user.id);
    setProfile(r.profile);
    setGamesHosted(r.gamesHosted);
  }, [user, loadUser]);

  const entitlement = useMemo<Entitlement | null>(() => {
    if (!user) return null;
    return computeEntitlement({
      isPro: profile?.is_pro ?? false,
      gamesHosted,
      createdAt: profile?.created_at ?? null,
    });
  }, [user, profile, gamesHosted]);

  const isAdmin = profile?.is_admin ?? false;

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      setDisplayName,
      refreshProfile,
      gamesHosted,
      entitlement,
      isAdmin,
    }),
    [
      session,
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      setDisplayName,
      refreshProfile,
      gamesHosted,
      entitlement,
      isAdmin,
    ],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
