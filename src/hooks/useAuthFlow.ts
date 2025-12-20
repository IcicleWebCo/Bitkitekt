import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type ConfirmationState = { type: 'confirmed' | 'error'; message?: string } | null;

export function useAuthFlow() {
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState<ConfirmationState>(null);
  const authEventProcessedRef = useRef<Set<string>>(new Set());
  const pendingConfirmationRef = useRef<{ type: string; userId?: string } | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const hashType = hashParams.get('type');

    if (accessToken && !authEventProcessedRef.current.has(accessToken)) {
      authEventProcessedRef.current.add(accessToken);
      pendingConfirmationRef.current = { type: hashType || 'unknown' };
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      else if (event === 'SIGNED_IN' && session) {
        setIsPasswordRecovery(false);

        const confirmationType = pendingConfirmationRef.current?.type;
        const hasAccessToken = !!pendingConfirmationRef.current;

        const userCreatedAt = new Date(session.user.created_at || '');
        const now = new Date();
        const accountAgeMinutes = (now.getTime() - userCreatedAt.getTime()) / 1000 / 60;
        const isNewAccount = accountAgeMinutes < 5;

        const shouldShowConfirmation = (
          (confirmationType === 'email' || confirmationType === 'signup') ||
          (hasAccessToken && isNewAccount)
        ) && !authEventProcessedRef.current.has(`signup-${session.user.id}`);

        if (shouldShowConfirmation) {
          authEventProcessedRef.current.add(`signup-${session.user.id}`);
          pendingConfirmationRef.current = null;
          setEmailConfirmation({ type: 'confirmed' });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      else if (event === 'USER_UPDATED') {
        setIsPasswordRecovery(false);
      }

      else if (event === 'SIGNED_OUT') {
        authEventProcessedRef.current.clear();
        pendingConfirmationRef.current = null;
        setEmailConfirmation(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    isPasswordRecovery,
    emailConfirmation,
    setEmailConfirmation,
    setIsPasswordRecovery
  };
}
