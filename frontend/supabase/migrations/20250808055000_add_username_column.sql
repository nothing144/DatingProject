/*
  # Add username column to profiles table

  1. Changes
    - Add `username` column to profiles table (text, nullable, unique)
    - Add index on username for search performance
    - Add constraint for username format (lowercase alphanumeric + underscore)

  2. Security
    - Username should be unique across all profiles
    - Username format validation (lowercase, alphanumeric, underscore only)
*/

-- Add username column to profiles table
ALTER TABLE profiles 
ADD COLUMN username text;

-- Add unique constraint on username (allowing nulls)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_username_unique 
UNIQUE (username);

-- Add check constraint for username format (lowercase alphanumeric + underscore)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_username_format 
CHECK (username IS NULL OR username ~ '^[a-z0-9_]+$');

-- Add index on username for search performance
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username) 
WHERE username IS NOT NULL;

-- Add partial index for case-insensitive username search
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON profiles(LOWER(username)) 
WHERE username IS NOT NULL;