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
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return null;
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, created_at')
      .eq('id', uid)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  }, []);

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
        loadProfile(data.session.user.id).then((p) => {
          if (!cancelled) setProfile(p);
        });
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).then((p) => {
          setProfile(p);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

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
    const fresh = await loadProfile(user.id);
    setProfile(fresh);
  }, [user, loadProfile]);

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
    ],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
