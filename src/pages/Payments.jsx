import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function Payments() {
  // Data states
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch payments and members from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsRes, membersRes] = await Promise.all([
        api.get('/api/payments'),
        api.get('/api/members'),
      ]);
      setPayments(paymentsRes.data.payments || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize form dates
  useEffect(() => {
    if (isFormOpen) {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setPeriodStart(today);
      setPeriodEnd(nextMonth.toISOString().split('T')[0]);
    }
  }, [isFormOpen]);

  // Helper: compute display status
  const computePaymentStatus = (payment) => {
    if (payment.status === 'completed') return 'Paid';
    if (payment.status === 'failed') return 'Failed';
    if (payment.status === 'refunded') return 'Refunded';
    if (payment.status === 'pending') {
      // Check if overdue (period_end < today)
      if (payment.period_end) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(payment.period_end);
        if (dueDate < today) return 'Overdue';
      }
      return 'Pending';
    }
    return payment.status;
  };

  // Transform API payment data for display
  const displayPayments = payments.map((p) => {
    const user = p.users || {};
    return {
      id: p.id,
      transactionId: p.transaction_id || p.id.substring(0, 8).toUpperCase(),
      memberName: user.name || 'Unknown',
      amount: parseFloat(p.amount) || 0,
      date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-',
      status: computePaymentStatus(p),
      paymentMethod: p.payment_method || 'cash',
      periodStart: p.period_start || '-',
      periodEnd: p.period_end || '-',
    };
  });

  // Compute financial stats
  const totalRevenue = displayPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidCount = displayPayments.filter(p => p.status === 'Paid').length;
  const totalOverdueAmount = displayPayments
    .filter(p => p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = displayPayments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = displayPayments.filter((payment) => {
    const matchesSearch = payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || payment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);

      // Find the member's user_id from the members list
      const member = members.find(m => m.id === selectedMemberId);
      const memberId = member?.user_id || selectedMemberId;

      await api.post('/api/payments', {
        member_id: memberId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        period_start: periodStart,
        period_end: periodEnd,
        notes: notes || null,
      });

      // Reset Form
      setSelectedMemberId('');
      setAmount('');
      setPaymentMethod('cash');
      setNotes('');
      setIsFormOpen(false);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setActionError(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      setActionLoading(true);
      setActionError(null);
      await api.put(`/api/payments/${paymentId}`, { status: newStatus });
      await fetchData();
    } catch (err) {
      console.error('Failed to update payment:', err);
      setActionError(err.response?.data?.error || 'Failed to update payment status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-md">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <span className="font-label-bold text-outline uppercase tracking-wider">Loading Payments...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-md text-center">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <span className="font-label-bold text-error uppercase">{error}</span>
          <button onClick={fetchData} className="brutalist-border px-lg py-sm font-label-bold uppercase hover:bg-surface-container-highest transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg p-md lg:p-0">
      {/* Action error toast */}
      {actionError && (
        <div className="bg-error/10 border border-error text-error px-md py-sm font-label-bold uppercase flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="material-symbols-outlined text-[18px]">close</button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-lg">
        <div>
          <p className="font-label-bold text-primary-container uppercase tracking-widest mb-xs text-xs">Billing & Accounting</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase">PAYMENTS</h3>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary-container text-on-primary-container px-lg py-sm font-headline-md text-headline-md uppercase flex items-center justify-center gap-xs hover:scale-105 active:scale-95 transition-transform shrink-0 self-start sm:self-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          <span className="material-symbols-outlined">add</span>
          RECORD PAYMENT
        </button>
      </div>

      {/* Financial Metrics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-surface-container border border-white/10 p-md flex flex-col justify-between">
          <span className="font-label-bold text-outline uppercase text-[12px]">Total Revenue</span>
          <span className="font-headline-xl text-headline-xl text-primary-container">₹{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-surface-container border border-white/10 p-md flex flex-col justify-between">
          <span className="font-label-bold text-outline uppercase text-[12px]">Paid Invoices</span>
          <span className="font-headline-xl text-headline-xl text-on-surface">{totalPaidCount}</span>
        </div>
        <div className="bg-surface-container border border-error/40 p-md flex flex-col justify-between">
          <span className="font-label-bold text-error uppercase text-[12px]">Overdue Collections</span>
          <span className="font-headline-xl text-headline-xl text-error">₹{totalOverdueAmount.toLocaleString()}</span>
        </div>
        <div className="bg-surface-container border border-white/10 p-md flex flex-col justify-between">
          <span className="font-label-bold text-outline uppercase text-[12px]">Pending Invoices</span>
          <span className="font-headline-xl text-headline-xl text-on-surface">₹{pendingAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filters Row */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-md mb-lg">
        <div className="md:col-span-8 flex items-center bg-surface-container-low brutalist-border brutalist-border-focus group px-sm">
          <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary-container transition-colors">search</span>
          <input
            type="text"
            placeholder="SEARCH TRANSACTIONS BY MEMBER NAME OR TRANSACTION ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-label-bold py-md placeholder:text-outline-variant/60 uppercase"
          />
        </div>
        <div className="md:col-span-4 brutalist-border bg-surface-container-low">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-label-bold py-md px-sm uppercase appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </section>

      {/* Ledger Table */}
      <div className="bg-surface-container border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline bg-surface-container-low">
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Member Name</th>
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Amount</th>
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Method</th>
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Date</th>
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider text-center">Status</th>
                <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/20">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-surface-container-high transition-colors group">
                  <td className="px-md py-md font-body-lg font-bold text-white uppercase">{payment.memberName}</td>
                  <td className="px-md py-md font-body-lg font-bold text-white">₹{payment.amount.toLocaleString()}</td>
                  <td className="px-md py-md font-body-md text-on-surface uppercase">{payment.paymentMethod}</td>
                  <td className="px-md py-md font-body-md text-on-surface opacity-75">{payment.date}</td>
                  <td className="px-md py-md text-center">
                    <span className={`brutalist-border px-sm py-xs font-label-bold text-[10px] uppercase ${
                      payment.status === 'Paid'
                        ? 'bg-green-500/10 text-green-500 border-green-500'
                        : payment.status === 'Overdue'
                        ? 'bg-error/10 text-error border-error'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-md py-md text-right">
                    {(payment.status === 'Pending' || payment.status === 'Overdue') && (
                      <button
                        onClick={() => handleUpdateStatus(payment.id, 'completed')}
                        disabled={actionLoading}
                        className="brutalist-border px-sm py-xs font-label-bold text-[10px] uppercase bg-green-500/10 text-green-500 border-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-lg text-center font-label-bold text-outline uppercase">
                    No Transaction Records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface border border-white/20 p-md lg:p-lg w-full max-w-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>

            <div className="flex justify-between items-start mb-lg">
              <div>
                <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface">RECORD NEW PAYMENT</h1>
                <div className="h-1 w-24 bg-primary-container mt-xs"></div>
              </div>
              <button
                onClick={() => { setIsFormOpen(false); setActionError(null); }}
                className="p-sm text-outline hover:text-white active:scale-95"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="bg-error/10 border border-error text-error px-md py-sm font-label-bold uppercase mb-md">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Select Member</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    className="w-full bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none font-body-md"
                  >
                    <option value="">-- SELECT GYM MEMBER --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.users?.name || 'Member'}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="ENTER TRANSACTION VALUE"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface placeholder:text-outline/50 focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none font-body-md appearance-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Notes</label>
                  <input
                    type="text"
                    placeholder="OPTIONAL NOTES"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface placeholder:text-outline/50 focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
              </div>

              <div className="pt-lg border-t border-on-surface/10 flex flex-col md:flex-row gap-md justify-end">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setActionError(null); }}
                  className="px-lg py-sm border-2 border-on-surface font-label-bold text-label-bold uppercase text-on-surface hover:bg-on-surface/10 transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-lg py-sm bg-primary-container font-label-bold text-label-bold uppercase text-on-primary hover:bg-primary-fixed-dim transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50"
                >
                  {actionLoading ? 'RECORDING...' : 'RECORD TRANSACTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
