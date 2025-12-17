/*
  # Create Polls System Tables

  ## Overview
  Creates a comprehensive polling system with polls, options, votes, and proper security.
  Polls will be randomly displayed between posts to add interactive engagement.

  ## New Tables

  ### `polls`
  Stores poll questions and metadata.
  
  #### Fields
  - `id` (uuid, primary key) - Unique identifier
  - `question` (text, required) - The poll question
  - `description` (text, optional) - Additional context or description
  - `category` (text, optional) - Poll category for filtering
  - `is_active` (boolean) - Whether poll is currently active
  - `created_at` (timestamptz) - Timestamp when poll was created
  - `updated_at` (timestamptz) - Timestamp when poll was last modified
  - `expires_at` (timestamptz, optional) - Optional expiration date

  ### `poll_options`
  Stores individual options for each poll.
  
  #### Fields
  - `id` (uuid, primary key) - Unique identifier
  - `poll_id` (uuid, required, foreign key) - References the parent poll
  - `option_text` (text, required) - The option text
  - `option_order` (integer, required) - Display order of options
  - `created_at` (timestamptz) - Timestamp when option was created

  ### `poll_votes`
  Tracks user votes on poll options.
  
  #### Fields
  - `id` (uuid, primary key) - Unique identifier
  - `poll_id` (uuid, required, foreign key) - References the poll
  - `poll_option_id` (uuid, required, foreign key) - References the selected option
  - `user_id` (uuid, required, foreign key) - References the voting user
  - `created_at` (timestamptz) - Timestamp when vote was cast

  ## Security
  - Enable RLS on all tables
  - Anyone (including anonymous) can view active polls and their options
  - Only authenticated users can vote
  - Users can only vote once per poll (enforced by unique constraint)
  - Users cannot change their vote once cast
  - Poll results are public (anyone can see vote counts)

  ## Indexes
  - Index on poll is_active for filtering
  - Index on poll_options poll_id for efficient option retrieval
  - Index on poll_votes for counting and duplicate detection
  - Composite index on poll_votes (user_id, poll_id) for user vote lookup

  ## Notes
  - Uses unique constraint to prevent duplicate voting
  - Cascade deletes ensure data integrity
  - Polls can be marked inactive without deletion
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  description text DEFAULT NULL,
  category text DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  CONSTRAINT question_not_empty CHECK (char_length(trim(question)) > 0)
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT option_text_not_empty CHECK (char_length(trim(option_text)) > 0)
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  poll_option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_poll_vote UNIQUE (user_id, poll_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls table
CREATE POLICY "Anyone can view active polls"
  ON polls
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all polls"
  ON polls
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for poll_options table
CREATE POLICY "Anyone can view options for active polls"
  ON poll_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all poll options"
  ON poll_options
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for poll_votes table
CREATE POLICY "Authenticated users can vote"
  ON poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view vote counts"
  ON poll_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Users cannot update votes"
  ON poll_votes
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Users cannot delete votes"
  ON poll_votes
  FOR DELETE
  TO authenticated
  USING (false);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_order ON poll_options(poll_id, option_order);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(poll_option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_poll ON poll_votes(user_id, poll_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on poll changes
DROP TRIGGER IF EXISTS on_poll_updated ON polls;
CREATE TRIGGER on_poll_updated
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION handle_poll_updated_at();