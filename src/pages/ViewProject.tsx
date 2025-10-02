import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Play} from 'lucide-react';
import logo from './Logo.png';

export const VideoReviewPages: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('preview');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();
  
  const PreviewPage = () => (
    <div className="min-h-screen bg-gray-100">
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
      <div className="max-w-2xl mx-auto p-24 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            </div>
          </div>

          {/* Project Title */}
          <h1 className="text-2xl font-bold mb-2">Project: Marketing Campaign 2024</h1>
          <p className="text-sm text-blue-600 mb-8">Video Draft 1 · Ready to review</p>

          {/* Video Container */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg p-12 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-8 aspect-video flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors shadow-lg">
                  <Play size={32} className="text-white fill-white ml-1" />
                </button>
              </div>
              <div className="absolute bottom-8">
                <h2 className="text-blue-600 font-semibold text-lg mb-1">Tido marketing Campege</h2>
                <p className="text-blue-600 text-sm">Your innovative idea or Naturas.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setCurrentPage('feedback')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Needs changes
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const FeedbackPage = () => (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <img src={logo} alt="Logo" className="h-10 w-auto" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-8">Needs changes</h1>

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
              onClick={() => {
                alert('Feedback submitted!');
                setCurrentPage('preview');
                setFeedback('');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page Toggle for Demo */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setCurrentPage('preview')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentPage === 'preview'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 shadow-sm'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setCurrentPage('feedback')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentPage === 'feedback'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 shadow-sm'
          }`}
        >
          Feedback
        </button>
      </div>

      {currentPage === 'preview' ? <PreviewPage /> : <FeedbackPage />}
    </div>
  );
};
