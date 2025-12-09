/*
  # Add filter preferences to profiles table

  1. Changes
    - Add `filter_preferences` column to `profiles` table
      - Type: jsonb (stores array of topic strings)
      - Default: empty array
      - Nullable: false
    
  2. Indexes
    - Add GIN index for efficient JSON queries on filter_preferences
  
  3. Notes
    - Users can save their preferred topic filters
    - Preferences persist across sessions
    - Stored as JSON array for flexibility and efficient querying
*/

-- Add filter_preferences column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'filter_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN filter_preferences jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Create GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS profiles_filter_preferences_idx ON profiles USING GIN (filter_preferences);