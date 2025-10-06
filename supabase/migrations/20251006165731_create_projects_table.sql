/*
  # Create projects table for video project management

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique project identifier
      - `user_id` (uuid, foreign key to auth.users) - Owner of the project
      - `project_name` (text) - Name of the project
      - `priority` (text) - Priority level: Low, Medium, High
      - `status` (text) - Current status: Submitted, In Progress, Completed
      - `file_url` (text, nullable) - URL to uploaded file in cloud storage
      - `file_name` (text, nullable) - Original filename
      - `monday_task_id` (text, nullable) - Reference to Monday.com task ID
      - `due_date` (date, nullable) - Project due date
      - `frame_io_id` (text, nullable) - Frame.io asset ID
      - `frame_io_project_id` (text, nullable) - Frame.io project ID
      - `feedback` (text, nullable) - User feedback for changes
      - `view_access` (boolean) - Whether user can view the project
      - `created_at` (timestamptz) - Project creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `projects` table
    - Add policy for users to view their own projects
    - Add policy for users to insert their own projects
    - Add policy for users to update their own projects
    - Add policy for users to delete their own projects

  3. Indexes
    - Create index on user_id for faster queries
    - Create index on status for filtering
    - Create index on due_date for date-based queries
    - Create index on frame_io_id for Frame.io integration
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Submitted',
  file_url text,
  file_name text,
  monday_task_id text,
  due_date date,
  frame_io_id text,
  frame_io_project_id text,
  feedback text,
  view_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_frame_io_id ON projects(frame_io_id);
