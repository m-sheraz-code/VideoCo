import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import logo from './Logo.png';

export const PreviewPage: React.FC = () => {
  const navigate = useNavigate();

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

      {/* Main Content */}
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

              <div className="absolute bottom-8 text-center">
                <h2 className="text-blue-600 font-semibold text-lg mb-1">Tido Marketing Campaign</h2>
                <p className="text-blue-600 text-sm">Your innovative idea or Naturas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Approve and need chnages buttons*/}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"  
        >
          Approve
        </button>
        <button
          onClick={() => navigate('/need-changes')}
          className="px-5 py-3 bg-white border text-black font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Need Changes
        </button>
      </div>  
      </div>
  );
};
