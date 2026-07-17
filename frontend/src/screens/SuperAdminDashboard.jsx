import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Header from '../components/Header';
import { 
  Building2, 
  Users, 
  IndianRupee, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Plus, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Activity,
  Globe,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  // New School Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['superAdminAnalytics'],
    queryFn: () => api.get('/super-admin/analytics'),
  });

  // 2. Fetch Schools List
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['superAdminSchools'],
    queryFn: () => api.get('/super-admin/schools'),
  });

  // 3. Toggle Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/super-admin/schools/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminSchools'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminAnalytics'] });
    },
  });

  // 4. Create School Mutation
  const createSchoolMutation = useMutation({
    mutationFn: (payload) => api.post('/super-admin/schools', payload),
    onSuccess: () => {
      setFormSuccess('School and Admin account created successfully!');
      setFormError('');
      setName('');
      setSlug('');
      setContactEmail('');
      setAddress('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      queryClient.invalidateQueries({ queryKey: ['superAdminSchools'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminAnalytics'] });
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to onboard school.');
      setFormSuccess('');
    },
  });

  const handleCreateSchool = (e) => {
    e.preventDefault();
    if (!name || !slug || !contactEmail || !adminName || !adminEmail || !adminPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }
    createSchoolMutation.mutate({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      contactEmail,
      address,
      adminName,
      adminEmail,
      adminPassword,
    });
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    statusMutation.mutate({ id, status: nextStatus });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Header />

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Platform Revenue</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">
              {analyticsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : formatCurrency(analytics?.totalRevenue || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">School Tenants</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">
              {analyticsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : analytics?.totalSchools || 0}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Workspaces</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">
              {analyticsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : analytics?.activeSchools || 0}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Platform Students</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">
              {analyticsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : analytics?.totalStudents || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Onboarding Form Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/40 lg:col-span-1 h-fit shadow-premium">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Onboard School Tenant
          </h3>

          {formError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-semibold rounded-xl mb-4">{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold rounded-xl mb-4">{formSuccess}</div>}

          <form onSubmit={handleCreateSchool} className="space-y-4 text-[10px] font-semibold text-slate-500">
            <div>
              <label className="block mb-1 text-[9px] uppercase">School Title *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Greenwood Academy"
                className="w-full glass-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-[9px] uppercase">Workspace Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. greenwood"
                className="w-full glass-input text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-[9px] uppercase">Contact Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@school.com"
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-[9px] uppercase">City Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bangalore"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/50">
              <span className="block text-[8px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Admin Credentials Setup</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-[9px] uppercase">Dr. Sarah Jenkins *</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase">Admin Email *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@school.com"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[9px] uppercase">Admin Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 glass-input text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createSchoolMutation.isPending}
              className="w-full glass-btn-primary flex items-center justify-center gap-1.5 text-xs py-3 mt-4"
            >
              {createSchoolMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Onboard Tenant
                </>
              )}
            </button>
          </form>
        </div>

        {/* Charts & School List section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Revenue Analytics Chart */}
          <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Tenant Revenue Breakdown
            </h3>

            <div className="h-60 w-full mt-2">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : analytics?.schoolsRevenue && analytics.schoolsRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.schoolsRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="slug" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.5)', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No billing transactions logged.
                </div>
              )}
            </div>
          </div>

          {/* Onboarded Schools List */}
          <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium overflow-hidden">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Tenant Workspace Directory
            </h3>

            {schoolsLoading ? (
              <div className="py-12 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : schools && schools.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Tenant Name</th>
                      <th className="pb-3">Subdomain</th>
                      <th className="pb-3">Contact Email</th>
                      <th className="pb-3 text-center">Active Status</th>
                      <th className="pb-3 text-right pr-2">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((school) => (
                      <tr key={school.id} className="border-b border-slate-200/50 hover:bg-white/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-slate-800">{school.name}</td>
                        <td className="py-3.5 text-slate-500 font-mono text-[10px]">/{school.slug}</td>
                        <td className="py-3.5 text-slate-500 font-medium">{school.contactEmail}</td>
                        <td className="py-3.5 text-center">
                          {school.status === 'ACTIVE' ? (
                            <span className="pastel-badge-green">Active</span>
                          ) : (
                            <span className="pastel-badge-red">Suspended</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => handleToggleStatus(school.id, school.status)}
                            disabled={statusMutation.isPending}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase border transition-all duration-200 ${
                              school.status === 'ACTIVE'
                                ? 'bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-600'
                                : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-600'
                            }`}
                          >
                            {statusMutation.isPending && statusMutation.variables?.id === school.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : school.status === 'ACTIVE' ? (
                              'Suspend'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                No school tenants registered yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
