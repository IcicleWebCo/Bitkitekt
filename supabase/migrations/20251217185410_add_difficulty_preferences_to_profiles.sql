/*
  # Add difficulty preferences to profiles table

  1. Changes
    - Add `difficulty_preferences` column to `profiles` table
      - Type: jsonb (stores array of difficulty strings)
      - Default: empty array
      - Nullable: false
    
  2. Indexes
    - Add GIN index for efficient JSON queries on difficulty_preferences
  
  3. Notes
    - Users can save their preferred difficulty filters
    - Preferences persist across sessions
    - Stored as JSON array for flexibility and efficient querying
*/

-- Add difficulty_preferences column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'difficulty_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN difficulty_preferences jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Create GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS profiles_difficulty_preferences_idx ON profiles USING GIN (difficulty_preferences);