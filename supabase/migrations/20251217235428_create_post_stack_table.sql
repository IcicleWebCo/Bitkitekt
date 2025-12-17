/*
  # Create Post Stack Table

  1. New Tables
    - `post_stack`
      - `id` (uuid, primary key) - Unique identifier for the stack entry
      - `post_id` (uuid, foreign key) - Reference to the post being stacked
      - `user_id` (uuid, foreign key) - Reference to the user who stacked the post
      - `created_at` (timestamptz) - Timestamp for LIFO ordering (most recent first)
  
  2. Indexes
    - Index on `post_id` for fast lookup when checking if a post is stacked
    - Index on `user_id` for efficient retrieval of user's stack
    - Index on `created_at` for LIFO ordering
    - Composite index on (user_id, created_at) for optimized stack retrieval
  
  3. Constraints
    - Unique constraint on (post_id, user_id) to prevent duplicate stack entries
    - Foreign key cascade on post deletion to clean up stack entries
    - Foreign key cascade on user deletion to clean up stack entries
  
  4. Security
    - Enable RLS on `post_stack` table
    - Add policy for authenticated users to view their own stack entries
    - Add policy for authenticated users to insert their own stack entries
    - Add policy for authenticated users to delete their own stack entries
*/

-- Create the post_stack table
CREATE TABLE IF NOT EXISTS post_stack (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_stack_post_id ON post_stack(post_id);
CREATE INDEX IF NOT EXISTS idx_post_stack_user_id ON post_stack(user_id);
CREATE INDEX IF NOT EXISTS idx_post_stack_created_at ON post_stack(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_stack_user_created ON post_stack(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE post_stack ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stack entries
CREATE POLICY "Users can view own stack entries"
  ON post_stack
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can push posts to their own stack
CREATE POLICY "Users can push to own stack"
  ON post_stack
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can pop posts from their own stack
CREATE POLICY "Users can pop from own stack"
  ON post_stack
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);