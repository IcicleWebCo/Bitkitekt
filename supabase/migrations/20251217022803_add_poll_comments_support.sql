/*
  # Add Poll Comments Support

  ## Overview
  Extends the comments table to support comments on polls in addition to posts.
  Comments can now be associated with either a post or a poll, but not both.

  ## Changes
  1. Add optional poll_id field to comments table
  2. Make post_id nullable (was required)
  3. Add check constraint to ensure comment has either post_id or poll_id
  4. Update RLS policies to allow comments on polls
  5. Add indexes for efficient poll comment queries

  ## Security
  - Comments on polls follow the same security model as post comments
  - Users must be authenticated to comment on polls
  - Anyone can view non-deleted comments on polls
  - Users can only edit/delete their own comments

  ## Notes
  - Maintains backward compatibility with existing post comments
  - Ensures data integrity with check constraint
*/

-- Add poll_id column to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'poll_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN poll_id uuid REFERENCES polls(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make post_id nullable since comments can now be on polls instead
ALTER TABLE comments ALTER COLUMN post_id DROP NOT NULL;

-- Add check constraint to ensure comment has either post_id or poll_id, but not both
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comment_has_post_or_poll'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT comment_has_post_or_poll
    CHECK (
      (post_id IS NOT NULL AND poll_id IS NULL) OR
      (post_id IS NULL AND poll_id IS NOT NULL)
    );
  END IF;
END $$;

-- Create index for efficient poll comment queries
CREATE INDEX IF NOT EXISTS idx_comments_poll_id ON comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_comments_poll_deleted ON comments(poll_id, deleted_at);

-- Update RLS policy for viewing comments to include poll comments
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON comments;
CREATE POLICY "Anyone can view non-deleted comments"
  ON comments
  FOR SELECT
  USING (deleted_at IS NULL);