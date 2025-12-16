/*
  # Allow public access to topics table

  ## Overview
  Updates the Row Level Security policy on the topics table to allow
  unauthenticated users to view topic information. This ensures filter
  buttons display their database-defined colors regardless of user
  authentication status.

  ## Changes
  1. Drop the existing authenticated-only SELECT policy
  2. Create a new public SELECT policy that allows both authenticated
     and unauthenticated users to read topic data

  ## Security Rationale
  - Topic color information is not sensitive data
  - Filter buttons should display consistently for all users
  - Read-only access to public styling information is safe
  - INSERT policy remains restricted to authenticated users only

  ## Impact
  - Unauthenticated users will now see properly colored filter buttons
  - No changes to write permissions (still authenticated only)
*/

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view topics" ON topics;

-- Create new policy allowing public read access
CREATE POLICY "Public users can view topics"
  ON topics
  FOR SELECT
  TO public
  USING (true);
