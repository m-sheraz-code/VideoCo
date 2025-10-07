import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import logo from './Logo.png';

export const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || '';

  return (
    <>
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto" />
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Verify your email</h1>
          <p className="text-slate-600 mb-6">
            We’ve sent a verification link to
            <br />
            <span className="font-semibold text-slate-900">{email}</span>
          </p>

          <p className="text-sm text-slate-500 mb-8">
            Please check your inbox (and spam folder) to verify your account before logging in.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    </>
  );
};
