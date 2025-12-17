/*
  # Add poll frequency preference to profiles

  1. Changes
    - Add `poll_frequency` column to `profiles` table
      - Type: text with check constraint for valid values
      - Default: 'normal' (polls appear every 4-5 posts)
      - Options: 'frequent' (every 2-3), 'normal' (every 4-5), 'rare' (every 8-10), 'none' (no polls)
  
  2. Notes
    - This allows users to customize how often polls appear in their feed
    - The default 'normal' frequency maintains current behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'poll_frequency'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN poll_frequency text DEFAULT 'normal' 
    CHECK (poll_frequency IN ('frequent', 'normal', 'rare', 'none'));
  END IF;
END $$;