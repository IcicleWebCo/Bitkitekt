import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const clearStorageIfNeeded = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (e) {
    console.warn('Storage quota exceeded, clearing old data');
    try {
      const keysToKeep = ['supabase.auth.token'];
      const storage: { [key: string]: string } = {};

      keysToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) storage[key] = value;
      });

      localStorage.clear();

      Object.entries(storage).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (clearError) {
      console.error('Failed to clear storage:', clearError);
      localStorage.clear();
    }
  }
};

clearStorageIfNeeded();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (e) {
          console.error('Storage getItem error:', e);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.error('Storage setItem error:', e);
          clearStorageIfNeeded();
          try {
            localStorage.setItem(key, value);
          } catch (retryError) {
            console.error('Failed to store auth token after clearing:', retryError);
          }
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Storage removeItem error:', e);
        }
      }
    }
  }
});
