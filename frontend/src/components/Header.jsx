import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, School, ShieldAlert, BadgeDollarSign, KeyRound, Lock, Loader2, X } from 'lucide-react';
import { api } from '../api';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setModalError('');
    setModalSuccess(false);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setModalError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters long.');
      return;
    }

    setIsModalLoading(true);
    setModalError('');

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setModalSuccess(true);
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err) {
      setModalError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Super Admin</span>;
      case 'SCHOOL_ADMIN':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">School Admin</span>;
      case 'ACCOUNTANT':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Accountant</span>;
      case 'STUDENT':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="glass-card rounded-2xl p-4 mb-6 border border-white/40 flex items-center justify-between no-print">
      {/* School / Platform Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
          {user?.role === 'SUPER_ADMIN' ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <School className="w-5 h-5" />
          )}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            {user?.role === 'SUPER_ADMIN' ? 'PaperBuddy Operational Hub' : (user?.schoolName || 'My School Portal')}
          </h2>
          <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
            {user?.role === 'SUPER_ADMIN' ? 'SaaS Administrator' : 'SaaS School Tenant Tenant'}
          </p>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-end">
              {user?.name}
              {getRoleBadge(user?.role)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">{user?.email}</div>
          </div>
          <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner uppercase">
            {user?.name ? user.name.slice(0, 2) : <User className="w-4 h-4" />}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all duration-300 active:scale-95 flex items-center justify-center"
          title="Change Password"
        >
          <KeyRound className="w-5 h-5" />
        </button>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all duration-300 active:scale-95 flex items-center justify-center"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative text-left">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
              <Lock className="w-5 h-5 text-indigo-600" />
              Change Password
            </h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Update your password security credentials.</p>

            {modalError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold font-sans">
                {modalError}
              </div>
            )}

            {modalSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <KeyRound className="w-5 h-5 animate-bounce" />
                </div>
                <p className="text-xs font-bold text-emerald-655 text-emerald-600">Password Changed Successfully!</p>
                <p className="text-[10px] text-slate-400 font-medium">Your password has been securely updated.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-[10px] font-semibold text-slate-500 font-sans">
                <div>
                  <label className="block mb-1.5 uppercase font-bold tracking-wide">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full glass-input text-xs font-medium text-slate-700 pr-10"
                      disabled={isModalLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-605 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 uppercase font-bold tracking-wide">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full glass-input text-xs font-medium text-slate-700 pr-10"
                      disabled={isModalLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-605 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 uppercase font-bold tracking-wide">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full glass-input text-xs font-medium text-slate-700 pr-10"
                      disabled={isModalLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-605 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isModalLoading}
                    className="flex-1 glass-btn-primary flex items-center justify-center gap-1.5 text-xs py-2.5 font-bold uppercase tracking-wider"
                  >
                    {isModalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="glass-btn-secondary text-xs py-2.5 px-4 font-bold uppercase tracking-wider"
                    disabled={isModalLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
