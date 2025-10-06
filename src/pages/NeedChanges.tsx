import { ArrowLeft } from 'lucide-react';
import React from 'react';
import logo from './Logo.png';
import { useNavigate } from 'react-router-dom';

export const NeedChanges: React.FC = () => {
  const navigate = useNavigate(); // ✅ define navigate
  const [feedback, setFeedback] = React.useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-slate-600 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-8">Needs Changes</h1>

          {/* Feedback Form */}
          <div className="mb-6">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter your feedback here..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
