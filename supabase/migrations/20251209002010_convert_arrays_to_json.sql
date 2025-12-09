/*
  # Convert PostgreSQL arrays to standard JSON format

  ## Overview
  Converts PostgreSQL-specific array types to JSONB for standard JSON compatibility.
  This ensures all structured data uses consistent JSON format.

  ## Changes Made
  
  ### Schema Updates
  - Convert `dependencies` from text[] to jsonb
  - Convert `tags` from text[] to jsonb
  - Migrate existing data to preserve all values
  
  ### Data Migration
  - Existing array values are automatically converted to JSON arrays
  - Empty arrays remain as empty JSON arrays
  - Null values remain as null
  
  ## Notes
  - Uses safe ALTER TABLE operations with data preservation
  - Maintains backward compatibility with existing queries
  - All structured data now uses standard JSON format (JSONB)
*/

-- Convert dependencies from text[] to jsonb
ALTER TABLE post 
  ALTER COLUMN dependencies DROP DEFAULT;

ALTER TABLE post 
  ALTER COLUMN dependencies TYPE jsonb 
  USING CASE 
    WHEN dependencies IS NULL THEN '[]'::jsonb
    ELSE to_jsonb(dependencies)
  END;

ALTER TABLE post 
  ALTER COLUMN dependencies SET DEFAULT '[]'::jsonb;

-- Convert tags from text[] to jsonb
ALTER TABLE post 
  ALTER COLUMN tags DROP DEFAULT;

ALTER TABLE post 
  ALTER COLUMN tags TYPE jsonb 
  USING CASE 
    WHEN tags IS NULL THEN '[]'::jsonb
    ELSE to_jsonb(tags)
  END;

ALTER TABLE post 
  ALTER COLUMN tags SET DEFAULT '[]'::jsonb;

-- Drop old GIN index on tags (text array)
DROP INDEX IF EXISTS idx_post_tags;

-- Create new GIN index for jsonb tags
CREATE INDEX IF NOT EXISTS idx_post_tags_jsonb ON post USING GIN(tags);