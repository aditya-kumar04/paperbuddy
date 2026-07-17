import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Mail, ArrowLeft, Loader2, Sparkles, School, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResetUrl('');

    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please verify the email and try again.');
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

          <h2 className="text-xl font-bold text-slate-800 mb-2">Forgot Password</h2>
          <p className="text-xs text-slate-400 font-medium mb-6">Enter your email and we'll generate a secure reset link.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Reset Request Generated</h3>
                <p className="text-xs text-slate-500 mt-1">
                  In a real production environment, a reset link is sent to your email.
                </p>
              </div>

              {resetUrl && (
                <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl text-left space-y-2">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Development Reset Link:</span>
                  <a
                    href={resetUrl}
                    className="block text-xs font-bold text-indigo-600 hover:underline break-all"
                  >
                    {resetUrl}
                  </a>
                  <p className="text-[9px] text-slate-400">Click the link above to test resetting the password.</p>
                </div>
              )}

              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          ) : (
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
                    Generating Link...
                  </>
                ) : (
                  'Generate Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel & Return
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
