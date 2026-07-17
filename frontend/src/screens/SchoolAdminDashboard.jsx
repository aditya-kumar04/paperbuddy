import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Header from '../components/Header';
import {
  IndianRupee,
  Users,
  AlertTriangle,
  FolderLock,
  Plus,
  Loader2,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  HelpCircle,
  Percent,
  TrendingUp,
  Settings,
  ShieldCheck,
  Search,
  UserPlus,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
  Receipt,
  Printer,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function SchoolAdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analytics');

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Form States - Fee Type
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeRecurring, setTypeRecurring] = useState(false);

  // Form States - Fee Structure
  const [fsType, setFsType] = useState('');
  const [fsClass, setFsClass] = useState('');
  const [fsAmount, setFsAmount] = useState('');
  const [fsDueDate, setFsDueDate] = useState('');
  const [fsAcademicYear, setFsAcademicYear] = useState('2026-2027');

  // Form States - Invite Accountant
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accPerms, setAccPerms] = useState({
    can_record_payment: true,
    can_apply_waiver: false,
    can_apply_penalty: false,
    can_reconcile_cheque: true,
    can_view_dashboard_metrics: true,
    can_edit_fee_structure: false,
  });

  // Form States - Excel Student Upload
  const [excelFile, setExcelFile] = useState(null);
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form States - Individual Student
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stPassword, setStPassword] = useState('Student123!');
  const [stPhone, setStPhone] = useState('');
  const [stRoll, setStRoll] = useState('');
  const [stClass, setStClass] = useState('');
  const [stSection, setStSection] = useState('A');
  const [stGuardian, setStGuardian] = useState('');
  const [stGPhone, setStGPhone] = useState('');

  // Form States - Apply Waiver / Penalty Dialog
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [actionType, setActionType] = useState('waiver'); // waiver or penalty
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Transactions Ledger states
  const [txnSearch, setTxnSearch] = useState('');
  const [txnMethod, setTxnMethod] = useState('');
  const [txnStatus, setTxnStatus] = useState('');
  const [printReceiptData, setPrintReceiptData] = useState(null);

  // Student Profile detail view state
  const [profileStudentId, setProfileStudentId] = useState(null);

  const { data: transactions, isLoading: txnsLoading } = useQuery({
    queryKey: ['adminTransactions', txnSearch, txnMethod, txnStatus],
    queryFn: () => api.get(`/accountant/transactions?search=${txnSearch}&method=${txnMethod}&status=${txnStatus}`),
  });

  const handleTriggerPrint = (txn) => {
    setPrintReceiptData(txn);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['schoolMetrics'],
    queryFn: () => api.get('/accountant/dashboard/metrics'),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['schoolStudents'],
    queryFn: () => api.get('/school-admin/students'),
  });

  const { data: accountants, isLoading: accountantsLoading } = useQuery({
    queryKey: ['schoolAccountants'],
    queryFn: () => api.get('/school-admin/accountants'),
  });

  const { data: feeTypes } = useQuery({
    queryKey: ['schoolFeeTypes'],
    queryFn: () => api.get('/school-admin/fee-types'),
  });

  const { data: structures } = useQuery({
    queryKey: ['schoolFeeStructures'],
    queryFn: () => api.get('/school-admin/fee-structures'),
  });

  const { data: unpaidFees } = useQuery({
    queryKey: ['unpaidFeesList', studentSearch, selectedClassFilter],
    queryFn: () => api.get(`/accountant/student-fees?status=UNPAID&search=${studentSearch}&class=${selectedClassFilter}`),
  });

  // ----------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------
  const createFeeTypeMutation = useMutation({
    mutationFn: (payload) => api.post('/school-admin/fee-types', payload),
    onSuccess: () => {
      setTypeName('');
      setTypeDesc('');
      setTypeRecurring(false);
      queryClient.invalidateQueries({ queryKey: ['schoolFeeTypes'] });
    },
  });

  const createFeeStructureMutation = useMutation({
    mutationFn: (payload) => api.post('/school-admin/fee-structures', payload),
    onSuccess: () => {
      setFsType('');
      setFsClass('');
      setFsAmount('');
      setFsDueDate('');
      queryClient.invalidateQueries({ queryKey: ['schoolFeeStructures'] });
      queryClient.invalidateQueries({ queryKey: ['schoolMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['schoolStudents'] });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (payload) => api.post('/school-admin/students', payload),
    onSuccess: () => {
      setStName('');
      setStEmail('');
      setStRoll('');
      setStClass('');
      setStGuardian('');
      setStGPhone('');
      setStPhone('');
      queryClient.invalidateQueries({ queryKey: ['schoolStudents'] });
      queryClient.invalidateQueries({ queryKey: ['schoolMetrics'] });
    },
  });

  const inviteAccountantMutation = useMutation({
    mutationFn: (payload) => api.post('/school-admin/accountants', payload),
    onSuccess: () => {
      setAccName('');
      setAccEmail('');
      setAccPassword('');
      setAccPhone('');
      queryClient.invalidateQueries({ queryKey: ['schoolAccountants'] });
    },
  });

  const updateAccountantMutation = useMutation({
    mutationFn: ({ id, permissions, status }) => api.patch(`/school-admin/accountants/${id}`, { permissions, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolAccountants'] });
    },
  });

  const applyWaiverMutation = useMutation({
    mutationFn: ({ id, amount, reason }) => api.post(`/school-admin/student-fees/${id}/waiver`, { waiverAmount: amount, reason }),
    onSuccess: () => {
      setActionMessage('Waiver discount successfully applied!');
      setSelectedFeeId('');
      setActionAmount('');
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['schoolMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidFeesList'] });
      queryClient.invalidateQueries({ queryKey: ['schoolStudents'] });
    },
  });

  const applyPenaltyMutation = useMutation({
    mutationFn: ({ id, amount }) => api.post(`/school-admin/student-fees/${id}/penalty`, { penaltyAmount: amount }),
    onSuccess: () => {
      setActionMessage('Overdue penalty successfully applied!');
      setSelectedFeeId('');
      setActionAmount('');
      queryClient.invalidateQueries({ queryKey: ['schoolMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidFeesList'] });
      queryClient.invalidateQueries({ queryKey: ['schoolStudents'] });
    },
  });

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------
  const handleCreateFeeType = (e) => {
    e.preventDefault();
    if (!typeName) return;
    createFeeTypeMutation.mutate({ name: typeName, description: typeDesc, isRecurring: typeRecurring });
  };

  const handleCreateFeeStructure = (e) => {
    e.preventDefault();
    if (!fsType || !fsClass || !fsAmount || !fsDueDate) return;
    createFeeStructureMutation.mutate({
      feeTypeId: fsType,
      class: fsClass,
      amount: fsAmount,
      dueDate: fsDueDate,
      academicYear: fsAcademicYear,
    });
  };

  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!stName || !stEmail || !stRoll || !stClass || !stGuardian || !stGPhone) return;
    createStudentMutation.mutate({
      name: stName,
      email: stEmail,
      password: stPassword,
      phone: stPhone,
      rollNumber: stRoll,
      class: stClass,
      section: stSection,
      guardianName: stGuardian,
      guardianPhone: stGPhone,
    });
  };

  const handleInviteAccountant = (e) => {
    e.preventDefault();
    if (!accName || !accEmail || !accPassword) return;
    inviteAccountantMutation.mutate({
      name: accName,
      email: accEmail,
      password: accPassword,
      phone: accPhone,
      permissions: accPerms,
    });
  };

  const handleAccountantPermissionToggle = (acc, key) => {
    const nextPerms = { ...acc.permissions, [key]: !acc.permissions?.[key] };
    updateAccountantMutation.mutate({ id: acc.id, permissions: nextPerms });
  };

  const handleAccountantStatusToggle = (acc) => {
    const nextStatus = acc.status === 'active' ? 'inactive' : 'active';
    updateAccountantMutation.mutate({ id: acc.id, status: nextStatus });
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) return;

    setUploadLoading(true);
    setBulkFeedback(null);
    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const data = await api.post('/school-admin/students/bulk-upload', formData);
      setBulkFeedback(data.summary);
      setExcelFile(null);
      queryClient.invalidateQueries({ queryKey: ['schoolStudents'] });
      queryClient.invalidateQueries({ queryKey: ['schoolMetrics'] });
    } catch (err) {
      alert(err.message || 'Excel upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleApplyAction = (e) => {
    e.preventDefault();
    if (!selectedFeeId || !actionAmount) return;
    setActionMessage('');

    if (actionType === 'waiver') {
      applyWaiverMutation.mutate({ id: selectedFeeId, amount: actionAmount, reason: actionReason });
    } else {
      applyPenaltyMutation.mutate({ id: selectedFeeId, amount: actionAmount });
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Header />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Invoiced</p>
            <h3 className="text-lg font-black text-slate-800">
              {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : formatCurrency(metrics?.totalExpected || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</p>
            <h3 className="text-lg font-black text-slate-800">
              {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : formatCurrency(metrics?.totalCollected || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
            <h3 className="text-lg font-black text-slate-800">
              {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : formatCurrency(metrics?.totalPending || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full blur-xl" />
          <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Overdues</p>
            <h3 className="text-lg font-black text-slate-800">
              {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : metrics?.defaultersCount || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/50 mb-6 gap-2 no-print overflow-x-auto">
        {[
          { id: 'analytics', label: 'Overview Metrics', icon: TrendingUp },
          { id: 'students', label: 'Students Desk', icon: GraduationCap, badge: students?.length },
          { id: 'fees', label: 'Fee Configuration', icon: Layers },
          { id: 'accountants', label: 'Staff Accounts', icon: ShieldCheck, badge: accountants?.length },
          { id: 'waivers', label: 'Adjustment Desk', icon: Percent },
          { id: 'transactions', label: 'Transactions', icon: Receipt, badge: transactions?.length }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[9px]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs panels content */}
      <div className="space-y-6">

        {/* PANEL 1: OVERVIEW METRICS */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Monthly Revenue Trend
              </h3>
              <div className="h-64 w-full">
                {metricsLoading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <Tooltip formatter={(v) => [formatCurrency(v), 'Collected']} />
                      <Area type="monotone" dataKey="collected" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No billing logs detected yet.</div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
                <FolderLock className="w-5 h-5 text-indigo-600" />
                Collection by Fee Category
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                {metricsLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : metrics?.feeTypeBreakdown && metrics.feeTypeBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.feeTypeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics.feeTypeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 text-xs">No payments mapped yet.</div>
                )}
              </div>
              {metrics?.feeTypeBreakdown && (
                <div className="flex flex-wrap gap-2 justify-center mt-2 text-[9px] font-semibold text-slate-400">
                  {metrics.feeTypeBreakdown.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.name}: {formatCurrency(item.value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: STUDENTS DESK */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Student Forms */}
            <div className="space-y-6 lg:col-span-1">
              {/* Excel Bulk Upload */}
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Excel Bulk Uploader
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4 font-medium">
                  Register entire classes. Header titles must exactly match: <span className="font-mono text-slate-600 bg-white/70 px-1 py-0.5 rounded">Name, Email, RollNumber, Class, Section, GuardianName, GuardianPhone</span>.
                </p>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors rounded-2xl p-4 text-center cursor-pointer relative bg-white/40">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setExcelFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="block text-xs font-bold text-slate-600">
                      {excelFile ? excelFile.name : 'Select Excel Document'}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1">xls, xlsx documents only</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!excelFile || uploadLoading}
                    className="w-full glass-btn-primary flex items-center justify-center gap-1 text-xs py-2.5"
                  >
                    {uploadLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing Rows...
                      </>
                    ) : (
                      'Upload spreadsheet'
                    )}
                  </button>
                </form>

                {bulkFeedback && (
                  <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
                    <h4 className="font-bold text-indigo-800">Processing Summary</h4>
                    <p className="text-slate-600 mt-1">Success count: <span className="font-bold text-indigo-700">{bulkFeedback.success}</span></p>
                    <p className="text-slate-600">Row errors: <span className="font-bold text-rose-600">{bulkFeedback.failed}</span></p>
                    {bulkFeedback.errors.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto space-y-1 bg-white/80 p-2 rounded-xl text-[9px] text-rose-500 font-mono">
                        {bulkFeedback.errors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Single Student Register */}
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Single Registration
                </h3>
                <form onSubmit={handleCreateStudent} className="space-y-3 text-[10px] font-semibold text-slate-500">
                  <div>
                    <label className="block mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      value={stName}
                      onChange={(e) => setStName(e.target.value)}
                      placeholder="Rohan Sharma"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={stEmail}
                        onChange={(e) => setStEmail(e.target.value)}
                        placeholder="rohan@gmail.com"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Roll Number *</label>
                      <input
                        type="text"
                        value={stRoll}
                        onChange={(e) => setStRoll(e.target.value)}
                        placeholder="GW-2026-1001"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block mb-1">Grade Class *</label>
                      <input
                        type="text"
                        value={stClass}
                        onChange={(e) => setStClass(e.target.value)}
                        placeholder="10"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Section *</label>
                      <input
                        type="text"
                        value={stSection}
                        onChange={(e) => setStSection(e.target.value)}
                        placeholder="A"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Phone</label>
                      <input
                        type="text"
                        value={stPhone}
                        onChange={(e) => setStPhone(e.target.value)}
                        placeholder="Optional"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1">Guardian Name *</label>
                      <input
                        type="text"
                        value={stGuardian}
                        onChange={(e) => setStGuardian(e.target.value)}
                        placeholder="Amit Sharma"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Guardian Phone *</label>
                      <input
                        type="text"
                        value={stGPhone}
                        onChange={(e) => setStGPhone(e.target.value)}
                        placeholder="+91987..."
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createStudentMutation.isPending}
                    className="w-full glass-btn-primary flex items-center justify-center gap-1 text-xs py-2.5 mt-2"
                  >
                    {createStudentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Register Student'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Students List Directory */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-600" />
                Active Student Directory
              </h3>

              {studentsLoading ? (
                <div className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : students && students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Roll No</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Class & Section</th>
                        <th className="pb-3">Guardian Info</th>
                        <th className="pb-3 text-right pr-2">Total Assigned Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => {
                        const totalAssigned = st.studentFees?.reduce((sum, f) => sum + Number(f.amountDue), 0) || 0;
                        return (
                          <tr key={st.id} className="border-b border-slate-200/50 hover:bg-white/40 transition-colors">
                            <td className="py-3.5 pl-2 font-mono text-slate-500">{st.rollNumber}</td>
                            <td className="py-3.5">
                              <button
                                onClick={() => setProfileStudentId(st.id)}
                                className="font-extrabold text-indigo-600 hover:underline text-left block"
                              >
                                {st.user.name}
                              </button>
                              <div className="text-[10px] text-slate-400">{st.user.email}</div>
                            </td>
                            <td className="py-3.5 text-slate-500 font-medium">Grade {st.class} — {st.section}</td>
                            <td className="py-3.5 text-[10px] text-slate-500">
                              <div className="font-bold text-slate-700">{st.guardianName}</div>
                              <div>{st.guardianPhone}</div>
                            </td>
                            <td className="py-3.5 text-right pr-2 font-black text-indigo-600">{formatCurrency(totalAssigned)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">No student profiles registered.</div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: FEE CONFIGURATION */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Fee Type */}
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-indigo-600" />
                Define Fee Type Category
              </h3>
              <form onSubmit={handleCreateFeeType} className="space-y-4 text-[10px] font-semibold text-slate-500">
                <div>
                  <label className="block mb-1">Category Title *</label>
                  <input
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Transport Fee"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Description (Optional)</label>
                  <textarea
                    value={typeDesc}
                    onChange={(e) => setTypeDesc(e.target.value)}
                    placeholder="e.g. Bus transportation charge"
                    className="w-full glass-input text-xs h-20"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={typeRecurring}
                    onChange={(e) => setTypeRecurring(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Is Recurring (Charged periodically, e.g. monthly)</span>
                </label>

                <button
                  type="submit"
                  disabled={createFeeTypeMutation.isPending}
                  className="w-full glass-btn-primary flex items-center justify-center gap-1 text-xs py-2.5"
                >
                  {createFeeTypeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Fee Category'}
                </button>
              </form>

              {/* Fee Types List */}
              <div className="mt-6 pt-6 border-t border-slate-200/50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Categories</h4>
                {feeTypes && feeTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {feeTypes.map((t) => (
                      <div key={t.id} className="px-3 py-1.5 rounded-xl border border-white/60 bg-white/40 text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.isRecurring && <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] uppercase px-1 rounded font-black">recurring</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No categories created yet.</p>
                )}
              </div>
            </div>

            {/* Create Fee Structure & Assign Class */}
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium h-fit">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-600" />
                Generate Class Fee Structures
              </h3>
              <form onSubmit={handleCreateFeeStructure} className="space-y-4 text-[10px] font-semibold text-slate-500">
                <div>
                  <label className="block mb-1">Choose Fee Category *</label>
                  <select
                    value={fsType}
                    onChange={(e) => setFsType(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  >
                    <option value="">Select Category</option>
                    {feeTypes?.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Target Class *</label>
                    <input
                      type="text"
                      value={fsClass}
                      onChange={(e) => setFsClass(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Academic Year *</label>
                    <input
                      type="text"
                      value={fsAcademicYear}
                      onChange={(e) => setFsAcademicYear(e.target.value)}
                      placeholder="2026-2027"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Billing Amount (INR) *</label>
                    <input
                      type="number"
                      value={fsAmount}
                      onChange={(e) => setFsAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Payment Due Date *</label>
                    <input
                      type="date"
                      value={fsDueDate}
                      onChange={(e) => setFsDueDate(e.target.value)}
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createFeeStructureMutation.isPending}
                  className="w-full glass-btn-primary flex items-center justify-center gap-1 text-xs py-2.5 mt-2"
                >
                  {createFeeStructureMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate & Auto-Assign to Class'
                  )}
                </button>
              </form>

              {/* Info alert */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-[10px] text-amber-700 leading-normal font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Auto-Assign Engine Trigger:</strong> Submitting this form will automatically generate individual bills (`StudentFee`) for all students currently registered in Grade Class.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: STAFF ACCOUNTS */}
        {activeTab === 'accountants' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invite Form */}
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium lg:col-span-1 h-fit">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-indigo-600" />
                Create Staff Account
              </h3>
              <form onSubmit={handleInviteAccountant} className="space-y-4 text-[10px] font-semibold text-slate-500">
                <div>
                  <label className="block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="Mark Miller"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={accEmail}
                    onChange={(e) => setAccEmail(e.target.value)}
                    placeholder="mark@school.com"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Password *</label>
                  <input
                    type="password"
                    value={accPassword}
                    onChange={(e) => setAccPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Phone</label>
                  <input
                    type="text"
                    value={accPhone}
                    onChange={(e) => setAccPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/50">
                  <span className="block text-[8px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Privileges Configuration</span>
                  
                  <div className="space-y-2 text-slate-600 text-[10px]">
                    {Object.keys(accPerms).map((permKey) => (
                      <label key={permKey} className="flex items-center gap-2.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={accPerms[permKey]}
                          onChange={(e) => setAccPerms({ ...accPerms, [permKey]: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{permKey.replace(/_/g, ' ').replace('can ', '')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={inviteAccountantMutation.isPending}
                  className="w-full glass-btn-primary flex items-center justify-center gap-1 mt-2 text-xs py-2.5"
                >
                  {inviteAccountantMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Accountant Account'
                  )}
                </button>
              </form>
            </div>

            {/* Accountants directory */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Active Staff Directory & Dynamic Permissions
              </h3>

              {accountantsLoading ? (
                <div className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : accountants && accountants.length > 0 ? (
                <div className="space-y-4">
                  {accountants.map((acc) => (
                    <div key={acc.id} className="p-4 bg-white/40 border border-white/60 hover:border-indigo-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-sm">{acc.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            acc.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {acc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{acc.email} • {acc.phone || 'No Phone'}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.keys(acc.permissions || {}).map((k) => {
                            const isGranted = acc.permissions?.[k] === true;
                            return (
                              <button
                                key={k}
                                onClick={() => handleAccountantPermissionToggle(acc, k)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                  isGranted
                                    ? 'bg-indigo-50 border-indigo-150 text-indigo-600'
                                    : 'bg-slate-100/50 border-slate-200 text-slate-400 line-through'
                                }`}
                              >
                                {k.replace('can_', '').replace(/_/g, ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAccountantStatusToggle(acc)}
                        className={`px-3 py-2 rounded-2xl font-bold text-[10px] uppercase border transition-colors md:self-center self-start ${
                          acc.status === 'active'
                            ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {acc.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">No staff accountants defined yet.</div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 5: ADJUSTMENT DESK */}
        {activeTab === 'waivers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search & Selection */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4">Unsettled Class Invoices</h3>

              <div className="flex flex-col md:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name or roll..."
                    className="pl-9 w-full glass-input text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  placeholder="Class"
                  className="w-28 glass-input text-xs"
                />
              </div>

              {unpaidFees && unpaidFees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Roll No</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Fee Type</th>
                        <th className="pb-3 text-right">Amount Due</th>
                        <th className="pb-3 text-right">Waiver / Penalty</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidFees.map((fee) => (
                        <tr key={fee.id} className="border-b border-slate-200/50 hover:bg-white/40 transition-colors">
                          <td className="py-3.5 pl-2 font-mono text-slate-500">{fee.student.rollNumber}</td>
                          <td className="py-3.5">
                            <span className="font-extrabold text-slate-800">{fee.student.user.name}</span>
                            <div className="text-[10px] text-slate-400">Class {fee.student.class}</div>
                          </td>
                          <td className="py-3.5 text-slate-600 font-bold">{fee.feeStructure.feeType.name}</td>
                          <td className="py-3.5 text-right font-black text-slate-800">{formatCurrency(fee.amountDue)}</td>
                          <td className="py-3.5 text-right">
                            <div className="text-emerald-600 font-black">- {formatCurrency(fee.waiverAmount)}</div>
                            <div className="text-rose-600 font-black">+ {formatCurrency(fee.penaltyAmount)}</div>
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <button
                              onClick={() => {
                                setSelectedFeeId(fee.id);
                                setActionMessage('');
                              }}
                              className="px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase border bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-600 transition-colors"
                            >
                              Configure Balance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">No pending invoices match search filters.</div>
              )}
            </div>

            {/* Adjustments Form */}
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium lg:col-span-1 h-fit">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Percent className="w-5 h-5 text-indigo-600" />
                Apply Adjustment Adjustment
              </h3>

              {actionMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold rounded-xl mb-4">
                  {actionMessage}
                </div>
              )}

              {selectedFeeId ? (
                <form onSubmit={handleApplyAction} className="space-y-4 text-[10px] font-semibold text-slate-500">
                  <div>
                    <label className="block mb-1.5 uppercase font-bold tracking-wide">Adjustment Operation Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType('waiver')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          actionType === 'waiver'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-white/40 border-slate-200 text-slate-400'
                        }`}
                      >
                        Apply Waiver
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType('penalty')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          actionType === 'penalty'
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-white/40 border-slate-200 text-slate-400'
                        }`}
                      >
                        Apply Penalty
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 uppercase font-bold tracking-wide">Adjustment Amount (INR) *</label>
                    <input
                      type="number"
                      value={actionAmount}
                      onChange={(e) => setActionAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>

                  {actionType === 'waiver' && (
                    <div>
                      <label className="block mb-1.5 uppercase font-bold tracking-wide">Waiver Reason *</label>
                      <input
                        type="text"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="e.g. Merit Scholarship"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={applyWaiverMutation.isPending || applyPenaltyMutation.isPending}
                      className="flex-1 glass-btn-primary flex items-center justify-center gap-1.5 text-xs py-2.5"
                    >
                      {(applyWaiverMutation.isPending || applyPenaltyMutation.isPending) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save Adjustment'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeId('')}
                      className="glass-btn-secondary text-xs py-2.5 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white/30">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Select "Configure Balance" from the unsettled invoices list to apply discounts or overdue penalties.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 6: TRANSACTIONS AUDITING LEDGER */}
        {activeTab === 'transactions' && (
          <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">All Transactions Ledger</h3>
                <p className="text-[11px] text-slate-400">Search and audit completed or pending payments. Recent transactions are sorted at the top.</p>
              </div>
              <Receipt className="w-5 h-5 text-indigo-500" />
            </div>

            {/* Search Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  placeholder="Search by student name or roll number..."
                  className="pl-10 w-full glass-input text-xs"
                />
              </div>

              <select
                value={txnMethod}
                onChange={(e) => setTxnMethod(e.target.value)}
                className="w-full md:w-36 glass-input text-xs"
              >
                <option value="">All Methods</option>
                <option value="CASH">CASH</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
              </select>

              <select
                value={txnStatus}
                onChange={(e) => setTxnStatus(e.target.value)}
                className="w-full md:w-36 glass-input text-xs"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="PENDING">PENDING</option>
                <option value="CLEARED">CLEARED</option>
                <option value="BOUNCED">BOUNCED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            {txnsLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Receipt ID</th>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">Bill Item</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-center pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-200/50 hover:bg-white/40 transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-[10px] text-slate-500">{tx.receiptUrl}</td>
                        <td className="py-3.5">
                          {tx.studentFee?.student ? (
                            <button
                              onClick={() => setProfileStudentId(tx.studentFee.student.id)}
                              className="font-extrabold text-indigo-600 hover:underline text-left"
                            >
                              {tx.studentFee.student.user?.name}
                            </button>
                          ) : (
                            <span className="font-extrabold text-slate-400">System User</span>
                          )}
                        </td>
                        <td className="py-3.5 font-mono text-slate-500 text-[10px]">{tx.studentFee?.student?.rollNumber}</td>
                        <td className="py-3.5 text-slate-600 font-bold">{tx.studentFee?.feeStructure?.feeType?.name}</td>
                        <td className="py-3.5 font-bold text-slate-500 text-[10px]">{tx.method}</td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tx.status === 'SUCCESS' || tx.status === 'CLEARED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right font-black text-indigo-600">{formatCurrency(Number(tx.amount))}</td>
                        <td className="py-3.5 text-center pr-2">
                          <button
                            onClick={() => handleTriggerPrint(tx)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors inline-flex items-center gap-1 font-bold text-[9px] uppercase"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">No transactions match your search filters.</div>
            )}
          </div>
        )}

      </div>

      {/* PRINT-ONLY RECEIPT LAYOUT */}
      {printReceiptData && (
        <div className="print-only hidden p-10 max-w-xl mx-auto border border-slate-400 rounded-3xl font-sans mt-12 bg-white text-black text-left">
          <div className="text-center pb-6 border-b border-slate-300">
            <h1 className="text-xl font-black uppercase tracking-wider">Greenwood International School</h1>
            <p className="text-[10px] text-slate-500 mt-1">Official Student Payment Receipt</p>
          </div>

          <div className="py-6 space-y-3.5 text-xs border-b border-slate-200">
            <div className="flex justify-between"><strong>Student Name:</strong> <span>{printReceiptData.studentFee?.student?.user?.name}</span></div>
            <div className="flex justify-between"><strong>Roll Number:</strong> <span>{printReceiptData.studentFee?.student?.rollNumber}</span></div>
            <div className="flex justify-between"><strong>Receipt Serial ID:</strong> <span className="font-mono">{printReceiptData.receiptUrl}</span></div>
            <div className="flex justify-between"><strong>Settlement Date:</strong> <span>{new Date(printReceiptData.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><strong>Transaction Type:</strong> <span className="uppercase">{printReceiptData.method}</span></div>
            <div className="flex justify-between"><strong>Status:</strong> <span className="uppercase font-bold">{printReceiptData.status}</span></div>
          </div>

          <div className="py-6 space-y-3 text-xs border-b border-slate-200">
            <div className="flex justify-between"><strong>Bill Category:</strong> <span>{printReceiptData.studentFee?.feeStructure?.feeType?.name}</span></div>
            <div className="flex justify-between"><strong>Original Tuition:</strong> <span>{formatCurrency(Number(printReceiptData.studentFee?.amountDue))}</span></div>
            {Number(printReceiptData.studentFee?.penaltyAmount) > 0 && <div className="flex justify-between text-red-500"><strong>Overdue Penalty:</strong> <span>+ {formatCurrency(Number(printReceiptData.studentFee?.penaltyAmount))}</span></div>}
            {Number(printReceiptData.studentFee?.waiverAmount) > 0 && <div className="flex justify-between text-green-600"><strong>Merit Waiver:</strong> <span>- {formatCurrency(Number(printReceiptData.studentFee?.waiverAmount))}</span></div>}
          </div>

          <div className="pt-6 flex justify-between font-black text-slate-900 text-sm">
            <span>TOTAL AMOUNT SETTLED:</span>
            <span>{formatCurrency(Number(printReceiptData.amount))}</span>
          </div>

          <div className="mt-20 text-center text-[9px] text-slate-400 italic">
            This invoice print represents a secure Ledger Transaction update generated on the PaperBuddy SaaS platform.
          </div>
        </div>
      )}

      {/* STUDENT DETAIL PROFILE MODAL */}
      {profileStudentId && (() => {
        const student = students?.find(s => s.id === profileStudentId);
        if (!student) return null;

        // Calculate totals
        let totalBilled = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;

        student.studentFees?.forEach(f => {
          const due = Number(f.amountDue);
          const paid = Number(f.amountPaid);
          const waiver = Number(f.waiverAmount);
          const penalty = Number(f.penaltyAmount);
          
          totalBilled += due + penalty;
          totalPaid += paid;
          totalOutstanding += Math.max(0, (due + penalty) - (paid + waiver));
        });

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-base shadow-sm">
                    {student.user?.name ? student.user.name.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">{student.user?.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Roll No: <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{student.rollNumber}</span> • Class {student.class} - {student.section}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileStudentId(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-6 flex-1 pr-1 text-xs text-left">
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Total Billed</span>
                    <span className="text-base font-black text-slate-800">{formatCurrency(totalBilled)}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                    <span className="block text-[8px] text-emerald-600/70 uppercase font-black tracking-wider">Total Paid</span>
                    <span className="text-base font-black text-emerald-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                    <span className="block text-[8px] text-rose-500 uppercase font-black tracking-wider">Total Outstanding</span>
                    <span className="text-base font-black text-rose-600">{formatCurrency(totalOutstanding)}</span>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 font-semibold text-slate-500">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-200/50 pb-1.5 font-black">Basic Information</span>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Email Address</span>
                      <span className="text-slate-700">{student.user?.email}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Phone Number</span>
                      <span className="text-slate-700">{student.user?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Guardian Name</span>
                      <span className="text-slate-700">{student.guardianName}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Guardian Phone</span>
                      <span className="text-slate-700">{student.guardianPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Fee List */}
                <div className="space-y-3">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-200/50 pb-1.5 font-black">Assigned Invoices History</span>
                  {student.studentFees && student.studentFees.length > 0 ? (
                    <div className="space-y-2">
                      {student.studentFees.map(fee => {
                        const remaining = Math.max(0, (Number(fee.amountDue) + Number(fee.penaltyAmount)) - (Number(fee.amountPaid) + Number(fee.waiverAmount)));
                        return (
                          <div key={fee.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center text-[10px]">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{fee.feeStructure.feeType.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                                  fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                  fee.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {fee.status}
                                </span>
                              </div>
                              <div className="text-slate-400 mt-1 font-medium">Due Date: {new Date(fee.dueDate).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[8px] text-slate-400 uppercase">Remaining</span>
                              <span className="font-extrabold text-slate-800">{formatCurrency(remaining)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No invoices assigned to this student profile.</p>
                  )}
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
