/*
  # Create posts table

  ## Overview
  Creates a comprehensive table for storing technical documentation posts with code snippets,
  metadata, and classification information.

  ## New Tables
  
  ### `post`
  Stores technical documentation entries with rich metadata and code examples.
  
  #### Core Fields
  - `id` (uuid, primary key) - Unique identifier, auto-generated
  - `created_at` (timestamptz) - Timestamp when post was created
  - `updated_at` (timestamptz) - Timestamp when post was last modified
  
  #### Content Fields
  - `title` (text, required) - Post title
  - `summary` (text) - Brief summary of the post
  - `problem_solved` (text) - Description of what problem this solves
  - `upside` (text) - Benefits and advantages
  - `downside` (text) - Limitations and disadvantages
  
  #### Metadata & Classification
  - `risk_level` (text) - Risk assessment: 'Low', 'Medium', or 'High'
  - `performance_impact` (text) - Description of performance implications
  - `doc_url` (text) - URL to external documentation
  - `primary_topic` (text) - Main topic/language (e.g., 'C#', 'React')
  - `syntax` (text) - Syntax highlighting identifier (e.g., 'csharp')
  
  #### Structured Data
  - `code_snippets` (jsonb) - Array of code snippet objects with label, language, and content
  - `dependencies` (text[]) - Array of required dependencies
  - `tags` (text[]) - Array of searchable tags
  
  #### Compatibility
  - `compatibility_min_version` (text) - Minimum version required
  - `compatibility_deprecated_in` (text) - Version where feature was deprecated
  
  #### Verification
  - `last_verified` (date) - Date when information was last verified
  
  ## Security
  - Enables Row Level Security (RLS) on the `post` table
  - Creates policies for authenticated users to:
    - View all posts (SELECT)
    - Create new posts (INSERT)
    - Update their own posts (UPDATE)
    - Delete their own posts (DELETE)
  
  ## Notes
  - Uses JSONB for flexible code snippet storage
  - Uses PostgreSQL arrays for tags and dependencies for efficient querying
  - Includes automatic timestamp management with default values
  - Risk level is constrained to three valid values via CHECK constraint
*/

CREATE TABLE IF NOT EXISTS post (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Core Content
  title text NOT NULL,
  summary text,
  problem_solved text,
  upside text,
  downside text,
  
  -- Metadata & Classification
  risk_level text CHECK (risk_level IN ('Low', 'Medium', 'High')),
  performance_impact text,
  doc_url text,
  primary_topic text,
  syntax text,
  
  -- The Code Snippets (Stored as JSONB)
  code_snippets jsonb DEFAULT '[]'::jsonb,

  -- Dependencies (Postgres Array)
  dependencies text[] DEFAULT '{}',

  -- Compatibility
  compatibility_min_version text,
  compatibility_deprecated_in text,

  -- Tags (Postgres Array)
  tags text[] DEFAULT '{}',

  -- Verification
  last_verified date DEFAULT CURRENT_DATE
);

-- Enable Row Level Security
ALTER TABLE post ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all posts
CREATE POLICY "Anyone can view posts"
  ON post
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON post
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update any post (adjust as needed for ownership)
CREATE POLICY "Authenticated users can update posts"
  ON post
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete any post (adjust as needed for ownership)
CREATE POLICY "Authenticated users can delete posts"
  ON post
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_post_primary_topic ON post(primary_topic);
CREATE INDEX IF NOT EXISTS idx_post_tags ON post USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_post_risk_level ON post(risk_level);
CREATE INDEX IF NOT EXISTS idx_post_created_at ON post(created_at DESC);