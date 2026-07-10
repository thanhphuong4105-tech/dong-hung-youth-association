-- Add new columns to tasks table for the redesigned Tasks page
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to  TEXT,
  ADD COLUMN IF NOT EXISTS role_name    TEXT,
  ADD COLUMN IF NOT EXISTS due_date     DATE,
  ADD COLUMN IF NOT EXISTS priority     TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'To Do'  CHECK (status  IN ('To Do', 'In Progress', 'Completed'));
