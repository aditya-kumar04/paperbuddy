import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api';
import { Lock, Mail, Loader2, Sparkles, School } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.post('/auth/login', { email, password });
      loginStore(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-premium border border-white/40 mb-3 hover:scale-105 transition-transform duration-300">
            <School className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5">
            PaperBuddy <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-semibold">SaaS</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Multi-tenant School Fee Management Platform</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-card rounded-3xl p-8 shadow-premium border border-white/30 relative">
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg transform rotate-12">
            <Sparkles className="w-4 h-4" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-6">Sign In to Your Portal</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full pl-11 glass-input focus:bg-white text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 glass-input focus:bg-white text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-btn-primary flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Fills for Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-200/50">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Demo Credentials (Click to fill)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@paperbuddy.com', 'SuperAdmin123!')}
                className="p-2 rounded-xl text-left bg-purple-50/70 border border-purple-100 hover:bg-purple-100/70 text-purple-700 transition-colors font-medium"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@greenwood.com', 'Admin123!')}
                className="p-2 rounded-xl text-left bg-blue-50/70 border border-blue-100 hover:bg-blue-100/70 text-blue-700 transition-colors font-medium"
              >
                School Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('accountant@greenwood.com', 'Accountant123!')}
                className="p-2 rounded-xl text-left bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/70 text-emerald-700 transition-colors font-medium"
              >
                Accountant
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('student@greenwood.com', 'Student123!')}
                className="p-2 rounded-xl text-left bg-amber-50/70 border border-amber-100 hover:bg-amber-100/70 text-amber-700 transition-colors font-medium"
              >
                Student Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
