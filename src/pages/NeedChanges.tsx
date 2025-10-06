import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import logo from './Logo.png';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const NeedChanges: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    if (!projectId) {
      setError('Project ID not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          feedback: feedback,
          status: 'In Progress'
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-600 hover:text-slate-800 transition text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 sm:mb-8">Request Changes</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="feedback" className="block text-sm font-semibold text-slate-700 mb-2">
              What changes would you like to see?
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-48 sm:h-64 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
              placeholder="Please provide detailed feedback about what changes you would like to see in this project..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
