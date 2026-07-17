import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Lock, Loader2, Sparkles, School, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !email) {
      setError('Invalid reset link. Missing token or email parameter.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
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

          <h2 className="text-xl font-bold text-slate-800 mb-2">Create New Password</h2>
          <p className="text-xs text-slate-400 font-medium mb-6">Resetting password for: <strong className="text-slate-600">{email || 'Unknown Email'}</strong></p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Password Reset Successful</h3>
                <p className="text-xs text-slate-450 mt-1.5 font-semibold text-indigo-600">
                  Redirecting you to Login page in 3 seconds...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-11 pr-10 glass-input focus:bg-white text-sm"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-11 pr-10 glass-input focus:bg-white text-sm"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full glass-btn-primary py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Reset Password
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
