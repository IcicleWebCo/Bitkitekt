/*
  # Create Post Likes (Power Ups) Table

  ## Overview
  This migration creates the social engagement feature for posts called "Power Ups" 
  (similar to likes but more energetic). Users can power up posts they enjoy.

  ## 1. New Tables
    - `post_likes`
      - `id` (uuid, primary key) - Unique identifier for each power up
      - `post_id` (uuid, foreign key) - References the post being powered up
      - `user_id` (uuid, foreign key) - References the user who powered up
      - `created_at` (timestamptz) - Timestamp when the power up was created

  ## 2. Constraints
    - Unique constraint on (post_id, user_id) to prevent duplicate power ups
    - Foreign key to post table with CASCADE delete (if post deleted, remove likes)
    - Foreign key to auth.users with CASCADE delete (if user deleted, remove their likes)

  ## 3. Security (RLS)
    - **Public Select:** Anyone (including unauthenticated users) can view power up counts
    - **Authenticated Insert:** Only logged-in users can power up posts
    - **Authenticated Delete:** Users can only remove their own power ups
    - This enables public visibility while protecting write operations

  ## 4. Indexes
    - Index on post_id for fast counting of power ups per post
    - Index on user_id for checking if a user has powered up a specific post
*/

-- Create the post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

-- Enable Row Level Security
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view power ups (needed for public counting)
CREATE POLICY "Anyone can view power ups"
  ON post_likes FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can power up posts
CREATE POLICY "Authenticated users can power up posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own power ups
CREATE POLICY "Users can remove their own power ups"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);