/*
  # Update post table RLS policies for public access

  ## Changes
  - Drop existing restrictive SELECT policy that requires authentication
  - Create new SELECT policy that allows public (anonymous) access to view all posts
  
  ## Security
  - Posts can be viewed by anyone (public access)
  - Write operations (INSERT, UPDATE, DELETE) still require authentication
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view posts" ON post;

-- Create new policy for public read access
CREATE POLICY "Public can view all posts"
  ON post
  FOR SELECT
  TO anon, authenticated
  USING (true);
