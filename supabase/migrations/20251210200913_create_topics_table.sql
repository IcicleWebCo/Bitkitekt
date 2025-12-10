/*
  # Create topics table

  ## Overview
  Creates a table to store topic information including gradient color schemes for UI rendering.
  This enables dynamic topic color management instead of hardcoded values in components.

  ## New Tables

  ### `topics`
  Stores topic names and their associated gradient color schemes.

  #### Fields
  - `id` (uuid, primary key) - Unique identifier, auto-generated
  - `name` (text, unique, required) - Topic name (e.g., 'React', 'Rust')
  - `gradient_from` (text, required) - Starting color of gradient (e.g., 'cyan-500')
  - `gradient_to` (text, required) - Ending color of gradient (e.g., 'blue-500')
  - `hover_gradient_from` (text, required) - Hover state starting color
  - `hover_gradient_to` (text, required) - Hover state ending color
  - `created_at` (timestamptz) - Timestamp when topic was created
  - `updated_at` (timestamptz) - Timestamp when topic was last modified

  ## Security
  - Enables Row Level Security (RLS) on the `topics` table
  - Allows all authenticated users to SELECT topics
  - Allows authenticated users to INSERT new topics (for auto-creation)
  - Restricts UPDATE and DELETE to maintain data integrity

  ## Indexes
  - Unique index on `name` for efficient lookups and duplicate prevention

  ## Notes
  - Topic colors are assigned when posts are created via Claude API
  - Frontend components fetch these colors to render topic filters
  - Initial topics are populated in a separate migration
*/

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  gradient_from text NOT NULL,
  gradient_to text NOT NULL,
  hover_gradient_from text NOT NULL,
  hover_gradient_to text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view topics
CREATE POLICY "Authenticated users can view topics"
  ON topics
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create new topics (for auto-generation)
CREATE POLICY "Authenticated users can create topics"
  ON topics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create unique index on name for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_name ON topics(name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);
