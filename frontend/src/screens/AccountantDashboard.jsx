import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/Header';
import {
  IndianRupee,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  AlertTriangle,
  HelpCircle,
  Coins,
  ShieldCheck,
  Calendar,
  Lock,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  AlertOctagon,
  BookOpen,
  Receipt,
  Printer
} from 'lucide-react';

export default function AccountantDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const permissions = user?.permissions || {};

  const canRecordPayment = permissions.can_record_payment === true;
  const canReconcileCheque = permissions.can_reconcile_cheque === true;
  const canApplyWaiver = permissions.can_apply_waiver === true;
  const canViewMetrics = permissions.can_view_dashboard_metrics === true;

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState('collection'); // collection or transactions

  // Search & Filter (Collection Desk)
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Search & Filter (Transactions Ledger)
  const [txnSearch, setTxnSearch] = useState('');
  const [txnMethod, setTxnMethod] = useState('');
  const [txnStatus, setTxnStatus] = useState('');

  // Form States - Record Payment
  const [selectedFee, setSelectedFee] = useState(null); // StudentFee object
  const [payMethod, setPayMethod] = useState('CASH'); // CASH, CHEQUE, UPI, CARD
  const [payAmount, setPayAmount] = useState('');
  const [chqNumber, setChqNumber] = useState('');
  const [chqDate, setChqDate] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Form States - Waiver / Penalty (if permitted)
  const [waiverFeeId, setWaiverFeeId] = useState('');
  const [actionType, setActionType] = useState('waiver'); // waiver, penalty
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Student Profile detail view state
  const [profileStudentId, setProfileStudentId] = useState(null);

  // Printing state
  const [printReceiptData, setPrintReceiptData] = useState(null);

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['accountantMetrics'],
    queryFn: () => api.get('/accountant/dashboard/metrics'),
    enabled: canViewMetrics || canReconcileCheque,
  });

  const { data: feesQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['accountantFeesQueue', search, classFilter],
    queryFn: () => api.get(`/accountant/student-fees?status=UNPAID&search=${search}&class=${classFilter}`),
    enabled: canRecordPayment || canApplyWaiver,
  });

  // School-wide transactions query
  const { data: transactions, isLoading: txnsLoading } = useQuery({
    queryKey: ['accountantTransactions', txnSearch, txnMethod, txnStatus],
    queryFn: () => api.get(`/accountant/transactions?search=${txnSearch}&method=${txnMethod}&status=${txnStatus}`),
  });

  // School-wide student profiles directory
  const { data: students } = useQuery({
    queryKey: ['schoolStudents'],
    queryFn: () => api.get('/school-admin/students'),
  });

  // ----------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------
  const recordPaymentMutation = useMutation({
    mutationFn: (payload) => api.post('/accountant/transactions', payload),
    onSuccess: () => {
      setPaySuccess('Payment recorded on server successfully!');
      setPayError('');
      setSelectedFee(null);
      setPayAmount('');
      setChqNumber('');
      setChqDate('');
      queryClient.invalidateQueries({ queryKey: ['accountantFeesQueue'] });
      queryClient.invalidateQueries({ queryKey: ['accountantMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['accountantTransactions'] });
    },
    onError: (err) => {
      setPayError(err.message || 'Failed to record payment');
      setPaySuccess('');
    },
  });

  const reconcileChequeMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/accountant/transactions/${id}/reconcile`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountantMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['accountantFeesQueue'] });
      queryClient.invalidateQueries({ queryKey: ['accountantTransactions'] });
    },
  });

  const applyWaiverMutation = useMutation({
    mutationFn: ({ id, amount, reason }) => api.post(`/school-admin/student-fees/${id}/waiver`, { waiverAmount: amount, reason }),
    onSuccess: () => {
      setActionMsg('Waiver discount successfully applied.');
      setWaiverFeeId('');
      setActionAmount('');
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['accountantFeesQueue'] });
      queryClient.invalidateQueries({ queryKey: ['accountantMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['accountantTransactions'] });
    },
  });

  const applyPenaltyMutation = useMutation({
    mutationFn: ({ id, amount }) => api.post(`/school-admin/student-fees/${id}/penalty`, { penaltyAmount: amount }),
    onSuccess: () => {
      setActionMsg('Late fee penalty successfully added.');
      setWaiverFeeId('');
      setActionAmount('');
      queryClient.invalidateQueries({ queryKey: ['accountantFeesQueue'] });
      queryClient.invalidateQueries({ queryKey: ['accountantMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['accountantTransactions'] });
    },
  });

  const handleOpenRecordPayment = (fee) => {
    setSelectedFee(fee);
    setPayError('');
    setPaySuccess('');
    const due = Number(fee.amountDue);
    const paid = Number(fee.amountPaid);
    const waiver = Number(fee.waiverAmount);
    const penalty = Number(fee.penaltyAmount);
    setPayAmount(due + penalty - paid - waiver);
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedFee || !payAmount) return;

    const payload = {
      studentFeeId: selectedFee.id,
      amount: parseFloat(payAmount),
      method: payMethod,
    };

    if (payMethod === 'CHEQUE') {
      if (!chqNumber || !chqDate) {
        setPayError('Cheque details (number & date) are required.');
        return;
      }
      payload.chequeNumber = chqNumber;
      payload.chequeDate = chqDate;
    }

    recordPaymentMutation.mutate(payload);
  };

  const handleReconcile = (txnId, outcome) => {
    reconcileChequeMutation.mutate({ id: txnId, status: outcome });
  };

  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!waiverFeeId || !actionAmount) return;

    if (actionType === 'waiver') {
      applyWaiverMutation.mutate({ id: waiverFeeId, amount: actionAmount, reason: actionReason });
    } else {
      applyPenaltyMutation.mutate({ id: waiverFeeId, amount: actionAmount });
    }
  };

  const handleTriggerPrint = (txn) => {
    setPrintReceiptData(txn);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Clean up printing state after print dialog is closed
  React.useEffect(() => {
    const handleAfterPrint = () => {
      setPrintReceiptData(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getRemainingAmount = (fee) => {
    return Number(fee.amountDue) + Number(fee.penaltyAmount) - Number(fee.amountPaid) - Number(fee.waiverAmount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Header />

      {/* Metrics Banner */}
      {canViewMetrics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl" />
            <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Projected Invoiced</p>
              <h3 className="text-lg font-black text-slate-800">
                {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : formatCurrency(metrics?.totalExpected || 0)}
              </h3>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/40 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl" />
            <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collected Dues</p>
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
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Defaulters Count</p>
              <h3 className="text-lg font-black text-slate-800">
                {metricsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : metrics?.defaultersCount || 0}
              </h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Dashboard statistics locks are active. Check with School Admin.
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200/50 mb-6 gap-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'collection'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Collection Desk</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Transactions Ledger</span>
        </button>
      </div>

      {/* Conditional Tabs Rendering */}
      {activeTab === 'collection' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left: Queue Grid */}
          <div className="lg:col-span-2 space-y-6">
            {canRecordPayment ? (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Cashier Collection Station</h3>
                    <p className="text-[11px] text-slate-400">Search and log manual student payments</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or roll number..."
                      className="pl-10 w-full glass-input text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    placeholder="Class"
                    className="w-24 glass-input text-xs"
                  />
                </div>

                {queueLoading ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : feesQueue && feesQueue.length > 0 ? (
                  <div className="space-y-4">
                    {feesQueue.map((fee) => {
                      const remaining = getRemainingAmount(fee);
                      return (
                        <div key={fee.id} className="p-4 bg-white/40 border border-white/60 hover:border-indigo-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setProfileStudentId(fee.student.id)}
                                className="font-extrabold text-indigo-600 hover:underline text-xs text-left"
                              >
                                {fee.student.user.name}
                              </button>
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">
                                {fee.student.rollNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              Class {fee.student.class} - {fee.student.section} • Fee: <span className="text-slate-600 font-bold">{fee.feeStructure.feeType.name}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                            <div className="text-left md:text-right">
                              <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-wider">Amount Due</span>
                              <span className="font-black text-slate-800 text-xs">{formatCurrency(remaining)}</span>
                            </div>

                            <button
                              onClick={() => handleOpenRecordPayment(fee)}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              Record Payment
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs">No pending invoices match search filters.</div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium flex flex-col items-center justify-center text-center py-16 text-slate-400 text-xs">
                <Lock className="w-12 h-12 text-slate-200 mb-2" />
                <span>Cashier Collection Station is deactivated by administrators.</span>
              </div>
            )}
          </div>

          {/* Right: Workspaces */}
          <div className="space-y-6">
            
            {/* Cheque reconcile stack */}
            {canReconcileCheque ? (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Cheque Reconciliation Desk
                </h3>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-medium">
                  Verify cheque clearings. Bounced cheques will trigger an automated <span className="font-bold text-rose-500">500 INR penalty fee</span>.
                </p>

                {metricsLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : metrics?.pendingCheques && metrics.pendingCheques.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.pendingCheques.map((chq) => (
                      <div key={chq.id} className="relative overflow-hidden p-4 rounded-2xl border border-white/60 bg-white/40 space-y-3 shadow-sm">
                        {/* Watermark Stamp */}
                        <div className="absolute right-4 top-4 border-2 border-dashed border-amber-500/20 text-amber-500/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded transform rotate-12">
                          Pending
                        </div>

                        <div className="text-[10px] space-y-1">
                          <div className="flex justify-between font-black text-slate-800">
                            <span>{chq.studentName}</span>
                            <span className="text-indigo-600">{formatCurrency(chq.amount)}</span>
                          </div>
                          <div className="text-slate-500 font-medium space-y-0.5 pt-1">
                            <div>Fee: {chq.feeName}</div>
                            <div>Cheque Ref: <span className="font-mono text-slate-600">{chq.chequeNumber}</span></div>
                            <div>Dated: {new Date(chq.chequeDate).toLocaleDateString()}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 text-[9px] font-bold">
                          <button
                            onClick={() => handleReconcile(chq.id, 'CLEARED')}
                            disabled={reconcileChequeMutation.isPending}
                            className="py-2 rounded-xl border bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-600 uppercase transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => handleReconcile(chq.id, 'BOUNCED')}
                            disabled={reconcileChequeMutation.isPending}
                            className="py-2 rounded-xl border bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-600 uppercase transition-colors"
                          >
                            Bounce
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-[10px] border border-dashed border-slate-200 rounded-2xl bg-white/30">
                    <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No pending cheques currently registered.
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium flex flex-col items-center justify-center text-center py-8 text-slate-400 text-xs">
                <Lock className="w-6 h-6 text-slate-300 mb-1" />
                <span>Cheque reconciliation locked by administrator.</span>
              </div>
            )}

            {/* Waiver desk (if permitted) */}
            {canApplyWaiver ? (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-indigo-500" />
                  Adjustment Operations Desk
                </h3>

                {actionMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold rounded-xl mb-4">
                    {actionMsg}
                  </div>
                )}

                {waiverFeeId ? (
                  <form onSubmit={handleApplyAdjustment} className="space-y-4 text-[10px] font-semibold text-slate-500">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType('waiver')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          actionType === 'waiver' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white/40 border-slate-200 text-slate-400'
                        }`}
                      >
                        Waiver Grant
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionType('penalty')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          actionType === 'penalty' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white/40 border-slate-200 text-slate-400'
                        }`}
                      >
                        Late Penalty
                      </button>
                    </div>

                    <div>
                      <label className="block mb-1 text-[9px] uppercase">Amount *</label>
                      <input
                        type="number"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        placeholder="e.g. 250"
                        className="w-full glass-input text-xs"
                        required
                      />
                    </div>

                    {actionType === 'waiver' && (
                      <div>
                        <label className="block mb-1 text-[9px] uppercase">Grant Reason *</label>
                        <input
                          type="text"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Sports Scholarship"
                          className="w-full glass-input text-xs"
                          required
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 glass-btn-primary py-2 text-xs">Apply</button>
                      <button type="button" onClick={() => setWaiverFeeId('')} className="glass-btn-secondary py-2 text-xs">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-[10px] border border-dashed border-slate-200 rounded-2xl bg-white/30">
                    Select student fee and click "Record Payment" to find details. Use the waiver desk inside.
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium flex flex-col items-center justify-center text-center py-8 text-slate-400 text-xs">
                <Lock className="w-6 h-6 text-slate-300 mb-1" />
                <span>Waiver approvals locked by administrator.</span>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* PANEL: TRANSACTIONS AUDITING LEDGER */
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
                      <td className="py-3.5 flex items-center">
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

      {/* Record Payment Drawer / Dialog */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Cash Register Invoice</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Collect balance for {selectedFee.student.user.name}</p>
              </div>
              <button
                onClick={() => setSelectedFee(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-semibold rounded-xl mb-4">{payError}</div>}
            {paySuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold rounded-xl mb-4">{paySuccess}</div>}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs font-semibold text-slate-500 overflow-y-auto flex-1 pr-1">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-[10px] text-slate-500">
                <div className="flex justify-between"><span>Fee Item:</span><span className="font-bold text-slate-800">{selectedFee.feeStructure.feeType.name}</span></div>
                <div className="flex justify-between"><span>Base Charge:</span><span className="font-bold text-slate-800">{formatCurrency(selectedFee.amountDue)}</span></div>
                {Number(selectedFee.penaltyAmount) > 0 && <div className="flex justify-between text-rose-500"><span>Penalty Added:</span><span>+{formatCurrency(selectedFee.penaltyAmount)}</span></div>}
                {Number(selectedFee.waiverAmount) > 0 && <div className="flex justify-between text-emerald-600"><span>Scholarship Discount:</span><span>-{formatCurrency(selectedFee.waiverAmount)}</span></div>}
                {Number(selectedFee.amountPaid) > 0 && <div className="flex justify-between text-slate-400"><span>Previously Settled:</span><span>{formatCurrency(selectedFee.amountPaid)}</span></div>}
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-black text-slate-800 text-xs">
                  <span>Balance Due:</span>
                  <span className="text-indigo-600">{formatCurrency(getRemainingAmount(selectedFee))}</span>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[9px] uppercase">Payment Category *</label>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {['CASH', 'CHEQUE', 'UPI', 'CARD'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPayMethod(m);
                        setPayError('');
                      }}
                      className={`py-2 rounded-xl border text-center font-bold transition-all ${
                        payMethod === m ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white/40 border-slate-200 text-slate-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[9px] uppercase">Amount Collected (INR) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount collected"
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              {payMethod === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[9px]">
                  <div>
                    <label className="block mb-1 uppercase font-bold text-slate-400">Cheque Number *</label>
                    <input
                      type="text"
                      value={chqNumber}
                      onChange={(e) => setChqNumber(e.target.value)}
                      placeholder="CHQ90812"
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 uppercase font-bold text-slate-400">Cheque Date *</label>
                    <input
                      type="date"
                      value={chqDate}
                      onChange={(e) => setChqDate(e.target.value)}
                      className="w-full glass-input text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="flex-1 glass-btn-primary flex items-center justify-center gap-1 text-xs py-3"
                >
                  {recordPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Payment'}
                </button>
                
                {canApplyWaiver && (
                  <button
                    type="button"
                    onClick={() => {
                      setWaiverFeeId(selectedFee.id);
                      setSelectedFee(null);
                    }}
                    className="glass-btn-secondary text-xs py-3"
                  >
                    Adjust Fee
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL (ON-SCREEN ONLY) */}
      {printReceiptData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl flex flex-col relative text-left font-sans">
            <button
              type="button"
              onClick={() => setPrintReceiptData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                {user?.schoolName || 'Greenwood International School'}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Official Student Payment Receipt</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs border-b border-slate-150 text-slate-650 font-medium">
              <div className="flex justify-between"><strong>Student Name:</strong> <span>{printReceiptData.studentFee?.student?.user?.name || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>Roll Number:</strong> <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{printReceiptData.studentFee?.student?.rollNumber || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>Class & Section:</strong> <span>{printReceiptData.studentFee?.student?.class ? `Class ${printReceiptData.studentFee.student.class} - ${printReceiptData.studentFee.student.section}` : 'N/A'}</span></div>
              <div className="flex justify-between"><strong>Receipt Serial ID:</strong> <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{printReceiptData.receiptUrl}</span></div>
              <div className="flex justify-between"><strong>Settlement Date:</strong> <span>{new Date(printReceiptData.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><strong>Payment Method:</strong> <span className="uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[10px]">{printReceiptData.method}</span></div>
              {printReceiptData.status && (
                <div className="flex justify-between"><strong>Status:</strong> <span className="uppercase font-bold text-emerald-650 text-emerald-600">{printReceiptData.status}</span></div>
              )}
            </div>

            <div className="py-4 space-y-2 text-xs border-b border-slate-150 text-slate-605 font-medium">
              <div className="flex justify-between"><strong>Bill Category:</strong> <span className="font-semibold text-slate-800">{printReceiptData.studentFee?.feeStructure?.feeType?.name}</span></div>
              <div className="flex justify-between"><strong>Original Tuition:</strong> <span>{formatCurrency(Number(printReceiptData.studentFee?.amountDue))}</span></div>
              {Number(printReceiptData.studentFee?.penaltyAmount) > 0 && (
                <div className="flex justify-between text-rose-500"><strong>Overdue Penalty:</strong> <span>+ {formatCurrency(Number(printReceiptData.studentFee?.penaltyAmount))}</span></div>
              )}
              {Number(printReceiptData.studentFee?.waiverAmount) > 0 && (
                <div className="flex justify-between text-emerald-600"><strong>Merit Waiver:</strong> <span>- {formatCurrency(Number(printReceiptData.studentFee?.waiverAmount))}</span></div>
              )}
            </div>

            <div className="pt-4 flex justify-between font-black text-slate-900 text-sm">
              <span>TOTAL AMOUNT SETTLED:</span>
              <span className="text-indigo-600">{formatCurrency(Number(printReceiptData.amount))}</span>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => window.print()}
                className="flex-1 glass-btn-primary flex items-center justify-center gap-1.5 text-xs py-2 font-bold uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => setPrintReceiptData(null)}
                className="glass-btn-secondary text-xs py-2 px-4 font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY RECEIPT LAYOUT */}
      {printReceiptData && (
        <div className="print-only hidden p-10 max-w-xl mx-auto border border-slate-400 rounded-3xl font-sans mt-12 bg-white text-black text-left">
          <div className="text-center pb-6 border-b border-slate-300">
            <h1 className="text-xl font-black uppercase tracking-wider">{user?.schoolName || 'Greenwood International School'}</h1>
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
