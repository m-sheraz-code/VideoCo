/*
  # Add view access column to projects table

  1. Changes
    - Add `view_access` column to projects table
      - Type: boolean
      - Default: false (no access granted by default)
      - Indicates whether admin has granted view access from Monday.com

  2. Notes
    - When view_access is false, the eye icon will be dimmed/disabled
    - When view_access is true, users can click to view project details
    - This flag is controlled by admin actions in Monday.com backend
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'view_access'
  ) THEN
    ALTER TABLE projects ADD COLUMN view_access boolean DEFAULT false;
  END IF;
END $$;