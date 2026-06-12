import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Animated counter
function AnimCount({ value, dur = 600, prefix = '', suffix = '' }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) { setD(0); return; }
    let s = 0; const step = Math.ceil(value / (dur / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t); } else setD(s); }, 16);
    return () => clearInterval(t);
  }, [value, dur]);
  return <>{prefix}{d.toLocaleString()}{suffix}</>;
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [notes, setNotes] = useState('');

  const formatDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [paymentsRes, membersRes] = await Promise.all([
        api.get('/api/payments'), api.get('/api/members'),
      ]);
      setPayments(paymentsRes.data.payments || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load payments. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (isFormOpen) {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
      setPeriodStart(today); setPeriodEnd(nextMonth.toISOString().split('T')[0]);
      setDueDate(today);
    }
  }, [isFormOpen]);

  const computePaymentStatus = (payment) => {
    if (payment.status === 'completed') return 'Paid';
    if (payment.status === 'failed') return 'Failed';
    if (payment.status === 'refunded') return 'Refunded';
    if (payment.status === 'pending') {
      if (payment.period_end) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dueDate = new Date(payment.period_end);
        if (dueDate < today) return 'Overdue';
      }
      return 'Pending';
    }
    return payment.status;
  };

  const displayPayments = payments.map((p) => {
    const user = p.users || {};
    return {
      id: p.id,
      transactionId: p.transaction_id || p.id.substring(0, 8).toUpperCase(),
      memberName: user.name || 'Unknown',
      amount: parseFloat(p.amount) || 0,
      rawDate: p.created_at ? new Date(p.created_at) : new Date(0),
      date: p.created_at ? formatDDMMYYYY(p.created_at) : '-',
      status: computePaymentStatus(p),
      paymentMethod: p.payment_method || 'cash',
      periodStart: p.period_start || '-',
      periodEnd: p.period_end || '-',
      dueDateDisplay: p.period_end ? formatDDMMYYYY(p.period_end) : '-',
    };
  });

  const totalRevenue = displayPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPaidCount = displayPayments.filter(p => p.status === 'Paid').length;
  const totalOverdueAmount = displayPayments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = displayPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = displayPayments.filter((payment) => {
    const matchesSearch = payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || payment.status === selectedStatus;
    const matchesMethod = !selectedMethod || payment.paymentMethod.toLowerCase() === selectedMethod.toLowerCase();
    
    let matchesDate = true;
    const pDate = payment.rawDate;
    const now = new Date();
    
    if (dateFilter === 'This Month') {
      matchesDate = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'Last Month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      matchesDate = pDate.getMonth() === lastMonth.getMonth() && pDate.getFullYear() === lastMonth.getFullYear();
    } else if (dateFilter === 'Custom' && customStart && customEnd) {
      const start = new Date(customStart); start.setHours(0,0,0,0);
      const end = new Date(customEnd); end.setHours(23,59,59,999);
      matchesDate = pDate >= start && pDate <= end;
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      const member = members.find(m => m.id === selectedMemberId);
      const memberId = member?.user_id || selectedMemberId;
      await api.post('/api/payments', {
        member_id: memberId, amount: parseFloat(amount),
        payment_method: paymentMethod, period_start: periodStart,
        period_end: periodEnd, due_date: dueDate, notes: notes || null,
        transaction_id: paymentMethod === 'upi' && upiRef ? upiRef : undefined,
      });
      setSelectedMemberId(''); setAmount(''); setPaymentMethod('cash'); setNotes(''); setDueDate(''); setUpiRef('');
      setIsFormOpen(false); setCurrentPage(1);
      setActionSuccess('Payment recorded successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to record payment.');
    } finally { setActionLoading(false); }
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Member', 'Amount', 'Method', 'Date', 'Due Date', 'Status'];
    const rows = filteredPayments.map(p => [
      p.transactionId,
      p.memberName,
      p.amount,
      p.paymentMethod,
      p.date,
      p.dueDateDisplay,
      p.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `kmarks-payments-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      setActionLoading(true); setActionError(null);
      const todayDate = new Date().toISOString().split('T')[0];
      await api.put(`/api/payments/${paymentId}`, { status: newStatus, paid_date: todayDate });
      setActionSuccess('Payment marked as paid.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update status.');
    } finally { setActionLoading(false); }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Payments...</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-surface-container border-2 border-error p-lg flex flex-col items-center gap-md max-w-md text-center shadow-[6px_6px_0px_0px_rgba(239,68,68,0.2)]">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '48px' }}>error</span>
          <h3 className="font-headline-md text-[18px] text-white uppercase">Connection Failed</h3>
          <p className="font-body-md text-[12px] text-on-surface/60">{error}</p>
          <button onClick={fetchData} className="bg-error text-white font-label-bold text-[12px] px-md py-sm uppercase hover:bg-white hover:text-black transition-colors active:scale-95">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-md lg:space-y-lg relative">
      {/* ─── Notification Toasts ─── */}
      {actionError && (
        <div className="bg-error/10 border border-error/30 text-error px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}

      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-md lg:py-md lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Billing & Accounting</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              Payments
            </h1>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleExportCSV}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-md py-sm uppercase hover:text-white hover:border-white transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Record Payment
            </button>
            <button
              onClick={fetchData}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter">
        {/* Total Revenue - Informational */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full blur-[30px] group-hover:bg-white/20 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">account_balance</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Total Revenue</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-primary-container leading-none mt-xs tracking-tighter">
                <AnimCount value={totalRevenue} prefix="₹" />
              </p>
            </div>
          </div>
        </div>

        {/* Paid Invoices */}
        <button
          onClick={() => { setSelectedStatus('Paid'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden ${
            selectedStatus === 'Paid' ? 'border-green-500/40' : 'border-white/[0.06] hover:border-green-500/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">check_circle</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Paid Invoices</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-green-500 leading-none mt-xs tracking-tighter">
                <AnimCount value={totalPaidCount} />
              </p>
            </div>
          </div>
        </button>

        {/* Pending Invoices */}
        <button
          onClick={() => { setSelectedStatus('Pending'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden hidden md:block ${
            selectedStatus === 'Pending' ? 'border-yellow-500/40' : 'border-white/[0.06] hover:border-yellow-500/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-yellow-500/20 rounded-full blur-[30px] group-hover:bg-yellow-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">pending_actions</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Pending</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-yellow-500 leading-none mt-xs tracking-tighter">
                <AnimCount value={pendingAmount} prefix="₹" />
              </p>
            </div>
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => { setSelectedStatus('Overdue'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden ${
            selectedStatus === 'Overdue' ? 'border-error/40' : 'border-white/[0.06] hover:border-error/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-error/20 rounded-full blur-[30px] group-hover:bg-error/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-error/15 group-hover:text-error/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">warning</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Overdue</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-error leading-none mt-xs tracking-tighter">
                <AnimCount value={totalOverdueAmount} prefix="₹" />
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* ─── Search & Filters ─── */}
      <section className="flex flex-col gap-sm">
        <div className="flex flex-col sm:flex-row gap-sm">
          <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors">
            <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by member name or transaction ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="material-symbols-outlined text-on-surface/30 hover:text-white text-[18px] transition-colors">close</button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-sm">
            {/* Status Filter */}
            <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
              >
                <option value="" className="bg-[#1A1A1A] text-white">All Statuses</option>
                <option value="Paid" className="bg-[#1A1A1A] text-white">Paid</option>
                <option value="Pending" className="bg-[#1A1A1A] text-white">Pending</option>
                <option value="Overdue" className="bg-[#1A1A1A] text-white">Overdue</option>
                <option value="Failed" className="bg-[#1A1A1A] text-white">Failed</option>
              </select>
            </div>
            
            {/* Method Filter */}
            <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
              <select
                value={selectedMethod}
                onChange={(e) => { setSelectedMethod(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
              >
                <option value="" className="bg-[#1A1A1A] text-white">All Methods</option>
                <option value="cash" className="bg-[#1A1A1A] text-white">Cash</option>
                <option value="upi" className="bg-[#1A1A1A] text-white">UPI</option>
                <option value="card" className="bg-[#1A1A1A] text-white">Card</option>
                <option value="bank_transfer" className="bg-[#1A1A1A] text-white">Bank Transfer</option>
                <option value="other" className="bg-[#1A1A1A] text-white">Other</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
              >
                <option value="" className="bg-[#1A1A1A] text-white">All Time</option>
                <option value="This Month" className="bg-[#1A1A1A] text-white">This Month</option>
                <option value="Last Month" className="bg-[#1A1A1A] text-white">Last Month</option>
                <option value="Custom" className="bg-[#1A1A1A] text-white">Custom Range</option>
              </select>
            </div>
            
            {(selectedStatus || selectedMethod || dateFilter) && (
              <button
                onClick={() => { setSelectedStatus(''); setSelectedMethod(''); setDateFilter(''); setCustomStart(''); setCustomEnd(''); setCurrentPage(1); }}
                className="border border-white/10 px-sm font-label-bold text-[10px] uppercase text-on-surface/50 hover:text-primary-container hover:border-primary-container/30 transition-colors flex items-center gap-[4px]"
              >
                <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Custom Date Range Inputs */}
        {dateFilter === 'Custom' && (
          <div className="flex gap-sm items-center bg-surface-container border border-white/[0.06] p-sm w-fit">
            <span className="font-label-bold text-[10px] uppercase text-on-surface/40">From:</span>
            <input type="date" lang="en-IN" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-transparent border border-white/10 text-white font-body-md text-[12px] p-1 focus:outline-none focus:border-primary-container/50" />
            <span className="font-label-bold text-[10px] uppercase text-on-surface/40 ml-sm">To:</span>
            <input type="date" lang="en-IN" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-transparent border border-white/10 text-white font-body-md text-[12px] p-1 focus:outline-none focus:border-primary-container/50" />
          </div>
        )}
      </section>

      {/* ─── Payments Table ─── */}
      <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member & ID</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Amount</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden md:table-cell">Method</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Date</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Due Date</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-center">Status</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment, idx) => (
                <tr
                  key={payment.id}
                  className={`group hover:bg-white/[0.02] transition-colors ${idx < paginatedPayments.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                >
                  <td className="py-sm px-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary-container/40 transition-colors">
                        <span className="font-headline-md text-[14px] text-primary-container">{payment.memberName.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-md text-[13px] font-bold text-white uppercase truncate leading-tight">{payment.memberName}</p>
                        <p className="font-label-sm text-[10px] text-on-surface/35 truncate">ID: {payment.transactionId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-sm px-md font-body-lg text-[15px] font-bold text-white">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="py-sm px-md hidden md:table-cell">
                    <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-primary-container/30 transition-colors">
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td className="py-sm px-md font-body-md text-[12px] text-on-surface/40 hidden lg:table-cell">
                    {payment.date}
                  </td>
                  <td className="py-sm px-md font-body-md text-[12px] text-on-surface/40 hidden lg:table-cell">
                    {payment.dueDateDisplay}
                  </td>
                  <td className="py-sm px-md text-center">
                    <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                      payment.status === 'Paid'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : payment.status === 'Overdue'
                        ? 'bg-error/10 text-error border border-error/20'
                        : payment.status === 'Pending'
                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        : 'bg-white/5 text-on-surface/50 border border-white/10'
                    }`}>
                      <span className={`w-[5px] h-[5px] rounded-full ${
                        payment.status === 'Paid' ? 'bg-green-500' : payment.status === 'Overdue' ? 'bg-error' : payment.status === 'Pending' ? 'bg-yellow-500' : 'bg-on-surface/30'
                      }`}></span>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-sm px-md text-right">
                    {(payment.status === 'Pending' || payment.status === 'Overdue') && (
                      <button
                        onClick={() => handleUpdateStatus(payment.id, 'completed')}
                        disabled={actionLoading}
                        className="border border-green-500/30 text-green-500 px-sm py-[4px] font-label-bold text-[9px] uppercase hover:bg-green-500/10 transition-colors disabled:opacity-30"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedPayments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-xl text-center">
                    <div className="flex flex-col items-center gap-sm">
                      <span className="material-symbols-outlined text-on-surface/15 text-[40px]">receipt_long</span>
                      <p className="font-label-bold text-[11px] text-on-surface/25 uppercase tracking-wider">
                        {searchTerm || selectedStatus ? 'No matching records found' : 'No transactions yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-label-bold text-[10px] text-on-surface/30 uppercase">
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
          </p>
          <div className="flex items-center gap-[4px]">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="w-8 h-8 flex items-center justify-center border border-white/[0.06] text-on-surface/40 hover:text-primary-container hover:border-primary-container/30 transition-all disabled:opacity-20 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 font-label-bold text-[11px] transition-all ${
                      currentPage === page
                        ? 'bg-primary-container/15 text-primary-container border border-primary-container/30'
                        : 'text-on-surface/30 hover:text-primary-container border border-transparent'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === 2 && currentPage > 3) return <span key="dots-start" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
              if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key="dots-end" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
              return null;
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center border border-white/[0.06] text-on-surface/40 hover:text-primary-container hover:border-primary-container/30 transition-all disabled:opacity-20 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Record Payment Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile" onClick={(e) => { if (e.target === e.currentTarget) { setIsFormOpen(false); setActionError(null); } }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-2xl relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

            <div className="p-md lg:px-lg lg:pt-lg flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">New Transaction</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">Record Payment</h2>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setActionError(null); }}
                className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="mx-md lg:mx-lg bg-error/10 border border-error/20 text-error px-md py-sm font-label-bold text-[10px] uppercase flex items-center gap-sm">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-md lg:px-lg lg:pb-lg space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Select Member *</label>
                  <div className="relative">
                    <select
                      value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="">-- SELECT GYM MEMBER --</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.users?.name || 'Member'}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Amount (₹) *</label>
                  <input
                    type="number" placeholder="Enter amount" value={amount}
                    onChange={(e) => setAmount(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Payment Method</label>
                  <div className="relative">
                    <select
                      value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="flex flex-col gap-[6px]">
                    <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">UPI Transaction ID</label>
                    <input
                      type="text" placeholder="e.g. 4158XXXXXXXX" value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                      className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Due Date</label>
                  <input
                    type="date" lang="en-IN" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Notes</label>
                  <input
                    type="text" placeholder="Optional notes" value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Period Start</label>
                  <input
                    type="date" lang="en-IN" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Period End</label>
                  <input
                    type="date" lang="en-IN" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
              </div>

              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end">
                <button
                  type="button" onClick={() => { setIsFormOpen(false); setActionError(null); }}
                  className="px-md py-sm border border-white/10 font-label-bold text-[11px] uppercase text-on-surface/50 hover:text-white hover:border-white/30 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="px-md py-sm bg-primary-container text-on-primary font-label-bold text-[11px] uppercase hover:brightness-110 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] disabled:opacity-50 flex items-center gap-xs"
                >
                  {actionLoading ? (
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> Recording...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">receipt_long</span> Record Payment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
