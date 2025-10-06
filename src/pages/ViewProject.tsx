import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from './Logo.png';

interface Project {
  id: string;
  project_name: string;
  status: string;
  priority: string;
  due_date: string | null;
  frame_io_id: string | null;
  frame_io_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export const PreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('Project not found');
        return;
      }

      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'Completed' })
        .eq('id', id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      alert('Failed to approve project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-slate-600 hover:text-slate-800 transition text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto" />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                project.status === 'Completed'
                  ? 'bg-green-100 text-green-700'
                  : project.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                project.priority === 'High'
                  ? 'bg-red-100 text-red-700'
                  : project.priority === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {project.priority} Priority
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">{project.project_name}</h1>

          {project.due_date && (
            <div className="flex items-center text-sm text-slate-600 mb-6">
              <Calendar className="w-4 h-4 mr-2" />
              Due: {new Date(project.due_date).toLocaleDateString()}
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-4 sm:p-15 mb-6">
            <div className="bg-slate-900 rounded-lg shadow-lg aspect-video flex flex-col items-center justify-center relative overflow-hidden">
              {project.frame_io_id ? (
                <div className="w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="text-center text-white">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm opacity-75">Frame.io Player</p>
                      <p className="text-xs opacity-50 mt-2">ID: {project.frame_io_id}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-75">No video available</p>
                    <p className="text-xs opacity-50 mt-2">Upload in progress</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleApprove}
              className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              Approve
            </button>
            <button
              onClick={() => navigate(`/need-changes?project=${id}`)}
              className="flex-1 sm:flex-none px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Need Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
