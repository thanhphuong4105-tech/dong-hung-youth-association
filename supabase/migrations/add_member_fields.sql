-- Add role and birthday columns to general_members table
ALTER TABLE general_members
  ADD COLUMN IF NOT EXISTS role     TEXT DEFAULT 'Member',
  ADD COLUMN IF NOT EXISTS birthday DATE;
