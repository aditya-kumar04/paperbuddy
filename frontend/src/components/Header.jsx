import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, School, ShieldAlert, BadgeDollarSign } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all duration-300 active:scale-95 flex items-center justify-center"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
