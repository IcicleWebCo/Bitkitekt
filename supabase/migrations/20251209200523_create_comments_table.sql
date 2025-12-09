/*
  # Create comments table with soft delete support

  ## Overview
  Creates a comprehensive comments table for post discussions with threaded replies
  and soft delete functionality to preserve comment history.

  ## New Tables
  
  ### `comments`
  Stores user comments and replies on posts with soft delete support.
  
  #### Core Fields
  - `id` (uuid, primary key) - Unique identifier, auto-generated
  - `post_id` (uuid, required, foreign key) - References the post being commented on
  - `user_id` (uuid, required, foreign key) - References the user who created the comment
  - `parent_comment_id` (uuid, nullable, foreign key) - References parent comment for nested replies
  - `content` (text, required) - The comment text content
  - `created_at` (timestamptz) - Timestamp when comment was created
  - `updated_at` (timestamptz) - Timestamp when comment was last modified
  - `deleted_at` (timestamptz, nullable) - Timestamp when comment was soft deleted
  - `is_edited` (boolean) - Flag indicating if comment has been edited
  
  ## Security
  - Enables Row Level Security (RLS) on the `comments` table
  - Anyone (including anonymous users) can view non-deleted comments
  - Only authenticated users can create comments
  - Users can only edit their own comments
  - Users can only soft-delete their own comments
  - Soft deleting a comment cascades to all child replies
  
  ## Indexes
  - Index on post_id for efficient comment retrieval by post
  - Index on parent_comment_id for efficient reply threading
  - Index on user_id for user's comment history
  - Composite index on post_id and deleted_at for filtering active comments
  
  ## Functions
  - Trigger to automatically update updated_at timestamp
  - Function to soft delete all child comments when parent is deleted
  
  ## Notes
  - Uses soft delete pattern to preserve comment history
  - Supports unlimited nesting depth for threaded discussions
  - Content has no length limit but frontend may enforce one
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  is_edited boolean DEFAULT false,
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anonymous) can view non-deleted comments
CREATE POLICY "Anyone can view non-deleted comments"
  ON comments
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can soft-delete their own comments (by setting deleted_at)
CREATE POLICY "Users can soft-delete own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_deleted ON comments(post_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on comment changes
DROP TRIGGER IF EXISTS on_comment_updated ON comments;
CREATE TRIGGER on_comment_updated
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_comment_updated_at();

-- Function to soft delete all child comments when parent is deleted
CREATE OR REPLACE FUNCTION soft_delete_child_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE comments
    SET deleted_at = NEW.deleted_at
    WHERE parent_comment_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cascade soft deletes to child comments
DROP TRIGGER IF EXISTS on_comment_soft_deleted ON comments;
CREATE TRIGGER on_comment_soft_deleted
  AFTER UPDATE ON comments
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION soft_delete_child_comments();