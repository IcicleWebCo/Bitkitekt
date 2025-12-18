/*
  # Update profile creation trigger

  1. Changes
    - Update `handle_new_user()` function to explicitly initialize all profile columns
    - Ensures filter_preferences, difficulty_preferences, and poll_frequency are set
    - This prevents any issues with default values not being applied

  2. Notes
    - The function now explicitly sets all fields including defaults
    - This makes profile creation more reliable and predictable
*/

-- Update function to explicitly set all profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    email,
    filter_preferences,
    difficulty_preferences,
    poll_frequency,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    '[]'::jsonb,
    '[]'::jsonb,
    'normal',
    now(),
    now()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
