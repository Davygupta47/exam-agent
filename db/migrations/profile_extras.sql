-- Migration: Profile extras (Allowed per agent.md §3.4 and §7)
-- Adds nullable fields for user avatar and profile details

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;
