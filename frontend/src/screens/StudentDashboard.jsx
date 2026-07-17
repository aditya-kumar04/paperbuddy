import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/Header';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Printer,
  Sparkles,
  Loader2,
  Calendar,
  AlertTriangle,
  Receipt,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  Unlock,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  ChevronRight,
  XCircle,
  X
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('invoices');

  // Active payment flow states
  const [selectedFee, setSelectedFee] = useState(null); // Fee object being paid
  const [payMethod, setPayMethod] = useState('UPI'); // UPI, CARD, NETBANKING
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdTxn, setCreatedTxn] = useState(null);

  // Card Inputs (Simulated UI with live visualizer updates)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI count down timer
  const [countdown, setCountdown] = useState(180); // 3 minutes

  // Active printable receipt state
  const [printReceiptData, setPrintReceiptData] = useState(null);

  // Countdown timer for mock QR code
  useEffect(() => {
    let timer;
    if (selectedFee && payMethod === 'UPI' && !isProcessing && !paymentSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 180));
      }, 1000);
    } else {
      setCountdown(180);
    }
    return () => clearInterval(timer);
  }, [selectedFee, payMethod, isProcessing, paymentSuccess]);

  // Clean up printing state after print dialog is closed
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintReceiptData(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['studentFees'],
    queryFn: () => api.get('/student/fees'),
  });

  const { data: transactions, isLoading: txnsLoading } = useQuery({
    queryKey: ['studentTransactions'],
    queryFn: () => api.get('/student/transactions'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }) => api.post(`/student/fees/${id}/pay`, { method }),
    onSuccess: (data) => {
      setCreatedTxn(data.transaction);
      setPaymentSuccess(true);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['studentFees'] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions'] });
    },
    onError: (err) => {
      setIsProcessing(false);
      alert(err.message || 'Payment simulation failed');
    },
  });

  const handleStartPayment = (fee) => {
    setSelectedFee(fee);
    setPaymentSuccess(false);
    setCreatedTxn(null);
    setIsProcessing(false);
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
  };

  const handleConfirmCheckout = (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    setIsProcessing(true);
    setProcessingStage('Connecting to PaperBuddy Secure Gateway...');

    setTimeout(() => {
      setProcessingStage('Authorizing transaction with issuing bank...');
      
      setTimeout(() => {
        setProcessingStage('Updating student ledger balances...');
        
        setTimeout(() => {
          payMutation.mutate({ id: selectedFee.id, method: payMethod });
        }, 600);
      }, 600);
    }, 600);
  };

  const handleTriggerPrint = (txn) => {
    setPrintReceiptData(txn);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const getCardType = (num) => {
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'Mastercard';
    return 'Credit Card';
  };

  // Calculations
  let outstandingBalance = 0;
  let settledAmount = 0;
  fees?.forEach((fee) => {
    const due = Number(fee.amountDue);
    const paid = Number(fee.amountPaid);
    const waiver = Number(fee.waiverAmount);
    const penalty = Number(fee.penaltyAmount);
    outstandingBalance += Math.max(0, (due + penalty) - (paid + waiver));
    settledAmount += paid;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Layout Header (Unscoped) */}
      <Header />

      {/* Main Student Hub Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar Nav & Student Badge */}
        <div className="lg:col-span-1 space-y-6 no-print">
          {/* Visual Profile ID Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-xl">
            {/* Design Watermark */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute right-4 top-4 opacity-15">
              <GraduationCap className="w-16 h-16" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-lg border border-white/10">
                ST
              </div>
              <div>
                <h4 className="font-extrabold text-base tracking-tight text-white/90">Student Portal</h4>
                <p className="text-[10px] text-white/60 uppercase font-semibold tracking-wider">Academic Sandbox</p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="block text-[9px] text-white/50 uppercase tracking-widest">Active Balance Due</span>
                <span className="text-2xl font-black">{formatCurrency(outstandingBalance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-white/80">
                <div>
                  <span className="block text-[8px] text-white/50 uppercase">Roll Number</span>
                  <span className="font-mono font-bold">GW-26-1001</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/50 uppercase">Current Grade</span>
                  <span className="font-bold">Class 10 - A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Navigation Menu */}
          <div className="glass-card rounded-3xl p-3 border border-white/40 shadow-premium space-y-1">
            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === 'invoices'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                Active Fee Invoices
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === 'receipts'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                Receipts Directory
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <div className="p-3 mt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-normal">
              <div className="flex items-center gap-1 text-slate-600 font-bold mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Security Notice
              </div>
              Every payment is fully simulated. No financial credentials are processed.
            </div>
          </div>
        </div>

        {/* Dynamic Center Panel */}
        <div className="lg:col-span-3 space-y-6 no-print">

          {/* TAB 1: INVOICES LIST */}
          {activeSubTab === 'invoices' && (
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Pending Invoices</h3>
                  <p className="text-[11px] text-slate-400">Class dues and payments timeline</p>
                </div>
                <span className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
                  {fees?.filter(f => f.status !== 'PAID' && f.status !== 'WAIVED').length || 0} Dues Left
                </span>
              </div>

              {feesLoading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
              ) : fees && fees.length > 0 ? (
                <div className="space-y-4">
                  {fees.map((fee) => {
                    const due = Number(fee.amountDue);
                    const paid = Number(fee.amountPaid);
                    const waiver = Number(fee.waiverAmount);
                    const penalty = Number(fee.penaltyAmount);
                    const remaining = Math.max(0, (due + penalty) - (paid + waiver));
                    const isOverdue = new Date(fee.dueDate) < new Date() && remaining > 0;

                    return (
                      <div key={fee.id} className="p-5 bg-white/40 border border-white/60 hover:border-indigo-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 text-sm">{fee.feeStructure.feeType.name}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              fee.status === 'PAID' ? 'pastel-badge-green' : 
                              fee.status === 'WAIVED' ? 'pastel-badge-blue' : 
                              fee.status === 'PARTIAL' ? 'pastel-badge-yellow' : 'pastel-badge-red'
                            }`}>
                              {fee.status}
                            </span>
                            {isOverdue && (
                              <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
                                <AlertTriangle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-medium">
                            <div>Due Date: <span className="text-slate-800 font-bold">{new Date(fee.dueDate).toLocaleDateString()}</span></div>
                            <div>Base Charge: <span className="text-slate-800 font-bold">{formatCurrency(due)}</span></div>
                            {penalty > 0 && <div className="text-rose-600">Late Penalty: +{formatCurrency(penalty)}</div>}
                            {waiver > 0 && <div className="text-emerald-600">Waiver: -{formatCurrency(waiver)}</div>}
                          </div>
                        </div>

                        {/* Payment / Balance Block */}
                        <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                          <div className="text-left md:text-right">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Remaining Balance</div>
                            <div className="text-base font-black text-slate-800">{formatCurrency(remaining)}</div>
                          </div>

                          {remaining > 0 ? (
                            <button
                              onClick={() => handleStartPayment(fee)}
                              className="px-5 py-3 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
                            >
                              Pay Now
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm font-black text-sm">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">No active bills assigned to your grade class.</div>
              )}
            </div>
          )}

          {/* TAB 2: RECEIPTS HISTORY */}
          {activeSubTab === 'receipts' && (
            <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-premium">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Ledger Transaction History
              </h3>

              {txnsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : transactions && transactions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 bg-white/40 border border-white/60 hover:border-indigo-100 rounded-3xl flex justify-between items-center transition-all duration-200">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs">{tx.studentFee.feeStructure.feeType.name}</h4>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(tx.createdAt).toLocaleDateString()} • {tx.method}</div>
                        <code className="block text-[8px] text-slate-500 font-mono mt-1 bg-white/70 px-1 py-0.5 rounded border border-slate-100 w-fit">{tx.receiptUrl}</code>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-indigo-600 text-xs">{formatCurrency(Number(tx.amount))}</div>
                        <button
                          onClick={() => handleTriggerPrint(tx)}
                          className="mt-2 text-[9px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-white border border-slate-200/50 hover:border-indigo-100 rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Invoice Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-3xl bg-white/30">
                  No payment records registered on the ledger yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* STRIPE-LIKE SECURE CHECKOUT FRAMEWAY (MODAL) */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Modal Invoice Details Panel */}
            <div className="w-full md:w-5/12 bg-slate-50 p-6 border-r border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-extrabold uppercase tracking-widest mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  Secure Checkout
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-wide">Paying For</span>
                    <h3 className="font-black text-slate-800 text-base leading-snug">{selectedFee.feeStructure.feeType.name}</h3>
                    <p className="text-[10px] text-slate-400">Class {selectedFee.student?.class || 'N/A'} - term: {selectedFee.feeStructure.academicYear}</p>
                  </div>

                  <div className="border-t border-slate-200/80 pt-4 space-y-2 text-[10px] text-slate-500 font-semibold">
                    <div className="flex justify-between"><span>Base Amount:</span><span className="text-slate-800">{formatCurrency(Number(selectedFee.amountDue))}</span></div>
                    {Number(selectedFee.penaltyAmount) > 0 && <div className="flex justify-between text-rose-500"><span>Late Penalties:</span><span>+{formatCurrency(Number(selectedFee.penaltyAmount))}</span></div>}
                    {Number(selectedFee.waiverAmount) > 0 && <div className="flex justify-between text-emerald-600"><span>Waivers:</span><span>-{formatCurrency(Number(selectedFee.waiverAmount))}</span></div>}
                    {Number(selectedFee.amountPaid) > 0 && <div className="flex justify-between text-slate-400"><span>Already Settled:</span><span>{formatCurrency(Number(selectedFee.amountPaid))}</span></div>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/80 pt-4 mt-6">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Sandbox Due</span>
                <span className="text-3xl font-black text-indigo-700">{formatCurrency(Number(selectedFee.amountDue) + Number(selectedFee.penaltyAmount) - Number(selectedFee.amountPaid) - Number(selectedFee.waiverAmount))}</span>
              </div>
            </div>

            {/* Modal Interactive Forms Panel */}
            <div className="flex-1 p-6 flex flex-col justify-between min-h-[420px]">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Simulated Gateway</span>
                <button
                  onClick={() => setSelectedFee(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  disabled={isProcessing}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* LOADER CYCLE */}
              {isProcessing ? (
                <div className="my-auto text-center space-y-4 py-8">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                  <h4 className="font-extrabold text-slate-700 text-sm">Processing Sandbox Transaction</h4>
                  <p className="text-xs text-slate-400 animate-pulse">{processingStage}</p>
                </div>
              ) : paymentSuccess ? (
                /* SUCCESS VIEW */
                <div className="my-auto text-center space-y-4 py-6">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Mock Payment Settled!</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                    This simulated payment has been finalized in the school ledger.
                  </p>
                  
                  {createdTxn && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-1.5 text-slate-500 text-left font-bold max-w-xs mx-auto">
                      <div className="flex justify-between"><span>Reference ID:</span><span className="font-mono text-slate-800">{createdTxn.receiptUrl}</span></div>
                      <div className="flex justify-between"><span>Amount Paid:</span><span className="text-indigo-600 font-bold">{formatCurrency(Number(createdTxn.amount))}</span></div>
                      <div className="flex justify-between"><span>Method:</span><span className="text-slate-800 uppercase">{createdTxn.method}</span></div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-center max-w-xs mx-auto pt-2">
                    <button
                      onClick={() => {
                        if (createdTxn) {
                          const printableObj = {
                            ...createdTxn,
                            studentFee: {
                              ...selectedFee,
                              student: { user: { name: user.name } }
                            }
                          };
                          handleTriggerPrint(printableObj);
                        }
                      }}
                      className="flex-1 glass-btn-primary flex items-center justify-center gap-1 text-xs py-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Receipt
                    </button>
                    <button
                      onClick={() => setSelectedFee(null)}
                      className="glass-btn-secondary text-xs py-2 px-3"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE FORM TABS */
                <form onSubmit={handleConfirmCheckout} className="space-y-4">
                  {/* Selector Header tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px]">
                    {[
                      { key: 'UPI', label: 'UPI QR' },
                      { key: 'CARD', label: 'Credit Card' },
                      { key: 'NETBANKING', label: 'Net Banking' }
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPayMethod(m.key)}
                        className={`py-2 rounded-xl text-center font-bold transition-all ${
                          payMethod === m.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* UPI QR Code Interface */}
                  {payMethod === 'UPI' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-36 h-36 bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center p-2 shadow-inner">
                        <QrCode className="w-20 h-20 text-slate-800" />
                        <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">Sandbox-QR-Code</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 font-semibold space-y-1">
                        <span className="flex items-center gap-1 text-amber-600 justify-center">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          Code expires in {formatCountdown(countdown)}
                        </span>
                        <p className="text-slate-400 leading-normal max-w-xs text-[9px] font-medium">
                          Scan with any UPI Sandbox app or trigger checkout below.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Credit Card Graphics and Inputs */}
                  {payMethod === 'CARD' && (
                    <div className="space-y-4">
                      {/* Live visual credit card render */}
                      <div className="relative aspect-[1.586/1] w-full max-w-[280px] mx-auto rounded-2xl bg-gradient-to-br from-indigo-700 to-pink-600 text-white p-5 flex flex-col justify-between shadow-xl">
                        <div className="flex justify-between items-start">
                          <div className="w-8 h-6 bg-yellow-400/80 border border-yellow-200/20 rounded-md shadow-inner" />
                          <span className="text-[10px] font-black italic tracking-wide">
                            {getCardType(cardNumber)}
                          </span>
                        </div>
                        <div className="text-sm font-mono tracking-widest text-center py-2">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="flex justify-between items-end text-[8px] font-mono uppercase tracking-wider text-white/90">
                          <div>
                            <span className="block text-[6px] text-white/50">Card Holder</span>
                            <span>{cardName || 'ROHAN SHARMA'}</span>
                          </div>
                          <div>
                            <span className="block text-[6px] text-white/50">Expiry</span>
                            <span>{cardExpiry || 'MM/YY'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="space-y-3 text-[10px] font-semibold text-slate-500">
                        <div>
                          <label className="block mb-1 text-[9px] uppercase">Cardholder Name *</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="ROHAN SHARMA"
                            className="w-full glass-input text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-[9px] uppercase">Card Number *</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            placeholder="4111 2222 3333 4444"
                            className="w-full glass-input text-xs"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block mb-1 text-[9px] uppercase">Expiry *</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full glass-input text-xs"
                              required
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-[9px] uppercase">CVV Code *</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              maxLength={3}
                              placeholder="•••"
                              className="w-full glass-input text-xs"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking banking partner selection */}
                  {payMethod === 'NETBANKING' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                      <label className="block mb-1.5 text-[9px] text-slate-500 uppercase font-bold tracking-wide">Select Net Banking Partner</label>
                      <select className="w-full glass-input text-xs" required>
                        <option value="sbi">State Bank of India (Sandbox)</option>
                        <option value="hdfc">HDFC Bank (Sandbox)</option>
                        <option value="icici">ICICI Bank (Sandbox)</option>
                        <option value="axis">Axis Bank (Sandbox)</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full glass-btn-primary flex items-center justify-center gap-1.5 text-xs py-3 mt-2"
                  >
                    Pay {formatCurrency(Number(selectedFee.amountDue) + Number(selectedFee.penaltyAmount) - Number(selectedFee.amountPaid) - Number(selectedFee.waiverAmount))} (Simulate)
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL (ON-SCREEN ONLY) */}
      {printReceiptData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl flex flex-col relative text-left font-sans">
            <button
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
              <div className="flex justify-between"><strong>Student Name:</strong> <span>{printReceiptData.studentFee?.student?.user?.name || user?.name}</span></div>
              <div className="flex justify-between"><strong>Roll Number:</strong> <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{printReceiptData.studentFee?.student?.rollNumber || user?.studentProfile?.rollNumber || 'GW-26-1001'}</span></div>
              <div className="flex justify-between"><strong>Class & Section:</strong> <span>{printReceiptData.studentFee?.student?.class ? `Class ${printReceiptData.studentFee.student.class} - ${printReceiptData.studentFee.student.section}` : (user?.studentProfile?.class ? `Class ${user.studentProfile.class} - ${user.studentProfile.section}` : 'Class 10 - A')}</span></div>
              <div className="flex justify-between"><strong>Receipt Serial ID:</strong> <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{printReceiptData.receiptUrl}</span></div>
              <div className="flex justify-between"><strong>Settlement Date:</strong> <span>{new Date(printReceiptData.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><strong>Payment Method:</strong> <span className="uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[10px]">{printReceiptData.method}</span></div>
              {printReceiptData.status && (
                <div className="flex justify-between"><strong>Status:</strong> <span className="uppercase font-bold text-emerald-600">{printReceiptData.status}</span></div>
              )}
            </div>

            <div className="py-4 space-y-2 text-xs border-b border-slate-150 text-slate-600 font-medium">
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
              <span className="text-indigo-650 text-indigo-600">{formatCurrency(Number(printReceiptData.amount))}</span>
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
        <div className="print-only hidden p-10 max-w-xl mx-auto border border-slate-400 rounded-3xl font-sans mt-12 bg-white text-black">
          <div className="text-center pb-6 border-b border-slate-300">
            <h1 className="text-xl font-black uppercase tracking-wider">{user?.schoolName || 'Greenwood International School'}</h1>
            <p className="text-[10px] text-slate-500 mt-1">Official Student Payment Receipt</p>
          </div>

          <div className="py-6 space-y-3.5 text-xs border-b border-slate-200">
            <div className="flex justify-between"><strong>Student Name:</strong> <span>{printReceiptData.studentFee?.student?.user?.name || user?.name}</span></div>
            <div className="flex justify-between"><strong>Roll Number:</strong> <span>{printReceiptData.studentFee?.student?.rollNumber || user?.studentProfile?.rollNumber || 'GW-26-1001'}</span></div>
            <div className="flex justify-between"><strong>Receipt Serial ID:</strong> <span className="font-mono">{printReceiptData.receiptUrl}</span></div>
            <div className="flex justify-between"><strong>Settlement Date:</strong> <span>{new Date(printReceiptData.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><strong>Transaction Type:</strong> <span className="uppercase">{printReceiptData.method}</span></div>
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

    </div>
  );
}
