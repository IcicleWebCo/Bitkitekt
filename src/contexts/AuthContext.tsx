import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionChecked = useRef(false);

  const loadProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadProfile(userId, retryCount + 1);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state');

    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.error('[AuthContext] Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session loaded:', {
        hasSession: !!session,
        userId: session?.user?.id
      });
      initialSessionChecked.current = true;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthContext] onAuthStateChange in context:', {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id,
        initialSessionChecked: initialSessionChecked.current
      });

      if (!initialSessionChecked.current) {
        console.log('[AuthContext] Skipping - initial session not checked yet');
        return;
      }

      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('[AuthContext] Loading profile for user:', session.user.id);
          await loadProfile(session.user.id);
        } else {
          console.log('[AuthContext] No session - clearing profile');
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      console.log('[AuthContext] Cleaning up');
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
