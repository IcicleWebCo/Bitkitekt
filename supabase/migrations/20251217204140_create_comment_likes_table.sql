/*
  # Create Comment Likes (Power Ups) Table

  ## Overview
  This migration creates the social engagement feature for comments called "Power Ups"
  (similar to likes but more energetic). Users can power up comments they enjoy.

  ## 1. New Tables
    - `comment_likes`
      - `id` (uuid, primary key) - Unique identifier for each power up
      - `comment_id` (uuid, foreign key) - References the comment being powered up
      - `user_id` (uuid, foreign key) - References the user who powered up
      - `created_at` (timestamptz) - Timestamp when the power up was created

  ## 2. Constraints
    - Unique constraint on (comment_id, user_id) to prevent duplicate power ups
    - Foreign key to comments table with CASCADE delete (if comment deleted, remove likes)
    - Foreign key to auth.users with CASCADE delete (if user deleted, remove their likes)

  ## 3. Security (RLS)
    - **Public Select:** Anyone (including unauthenticated users) can view power up counts
    - **Authenticated Insert:** Only logged-in users can power up comments
    - **Authenticated Delete:** Users can only remove their own power ups
    - This enables public visibility while protecting write operations

  ## 4. Indexes
    - Index on comment_id for fast counting of power ups per comment
    - Index on user_id for checking if a user has powered up a specific comment
*/

-- Create the comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_comment_user_like UNIQUE (comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created_at ON comment_likes(created_at);

-- Enable Row Level Security
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view power ups (needed for public counting)
CREATE POLICY "Anyone can view power ups"
  ON comment_likes FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can power up comments
CREATE POLICY "Authenticated users can power up comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own power ups
CREATE POLICY "Users can remove their own power ups"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
