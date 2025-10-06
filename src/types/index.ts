export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Submitted' | 'In Progress' | 'Completed';
  file_url: string | null;
  file_name: string | null;
  due_date: string | null;
  frame_io_id: string | null;
  frame_io_project_id: string | null;
  feedback: string | null;
  view_access: boolean;
  monday_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  project_name: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  file_url?: string;
  file_name?: string;
  frame_io_id?: string;
  frame_io_project_id?: string;
}

export interface UpdateProjectInput {
  project_name?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Submitted' | 'In Progress' | 'Completed';
  due_date?: string;
  feedback?: string;
  frame_io_id?: string;
  frame_io_project_id?: string;
  view_access?: boolean;
}
