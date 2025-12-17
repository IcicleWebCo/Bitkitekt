import { supabase } from '../lib/supabase';
import type { PollFrequency } from '../types/database';

export async function saveFilterPreferences(userId: string, preferences: string[]): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      filter_preferences: preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to save filter preferences: ${error.message}`);
  }
}

export async function loadFilterPreferences(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('filter_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load filter preferences: ${error.message}`);
  }

  return data?.filter_preferences || [];
}

export async function clearFilterPreferences(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      filter_preferences: [],
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to clear filter preferences: ${error.message}`);
  }
}

export async function savePollFrequency(userId: string, frequency: PollFrequency): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      poll_frequency: frequency,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to save poll frequency: ${error.message}`);
  }
}
