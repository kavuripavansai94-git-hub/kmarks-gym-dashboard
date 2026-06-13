import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

// Animated counter
function AnimCount({ value, dur = 600, prefix = '' }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) { setD(0); return; }
    let s = 0; const step = Math.ceil(value / (dur / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t); } else setD(s); }, 16);
    return () => clearInterval(t);
  }, [value, dur]);
  return <>{prefix}{d.toLocaleString()}</>;
}

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Form state
  const [editId, setEditId] = useState(null);
  const [branchId, setBranchId] = useState('');
  const [category, setCategory] = useState('Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [isRecurring, setIsRecurring] = useState(false);

  // Mark Paid state
  const [paidExpense, setPaidExpense] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [expRes, branchRes] = await Promise.all([
        api.get('/api/expenses'),
        api.get('/api/branches')
      ]);
      setExpenses(expRes.data.expenses || []);
      setBranches(branchRes.data.branches || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Derive stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  let totalMonthly = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let pendingCount = 0;

  expenses.forEach(exp => {
    const amt = parseFloat(exp.amount) || 0;
    const expDate = new Date(exp.due_date);
    
    // Only count expenses due in the current month towards the "Total Monthly" card
    if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
      totalMonthly += amt;
    }

    if (exp.status === 'PAID') {
      totalPaid += amt;
    } else if (exp.status === 'PENDING') {
      totalPending += amt;
      pendingCount++;
    } else if (exp.status === 'OVERDUE') {
      totalOverdue += amt;
    }
  });

  const paidPercentage = totalMonthly > 0 ? Math.round((totalPaid / (totalPaid + totalPending + totalOverdue)) * 100) : 0;

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    const matchesBranch = branchFilter === 'All' || exp.branchName === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const getStatusColor = (s) => {
    switch(s) {
      case 'PAID': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'OVERDUE': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface border-white/10';
    }
  };

  const handleOpenForm = (expense = null) => {
    if (expense) {
      setEditId(expense.id);
      setBranchId(expense.branch_id || '');
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount);
      setDueDate(expense.due_date);
      setStatus(expense.status);
      setIsRecurring(expense.is_recurring);
    } else {
      setEditId(null);
      setBranchId('');
      setCategory('Rent');
      setDescription('');
      setAmount('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('PENDING');
      setIsRecurring(false);
    }
    setActionError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      const payload = {
        branch_id: branchId || null,
        category,
        description,
        amount: parseFloat(amount),
        status,
        due_date: dueDate,
        is_recurring: isRecurring
      };

      if (editId) {
        await api.put(`/api/expenses/${editId}`, payload);
        setActionSuccess('Expense updated successfully!');
      } else {
        await api.post('/api/expenses', payload);
        setActionSuccess('Expense added successfully!');
      }

      setIsFormOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchExpenses();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to save expense.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenMarkPaid = (expense) => {
    setPaidExpense(expense);
    setPaymentMethod('cash');
    setActionError(null);
    setIsMarkPaidOpen(true);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      await api.put(`/api/expenses/${paidExpense.id}`, {
        status: 'PAID',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod
      });
      setIsMarkPaidOpen(false);
      setActionSuccess('Expense marked as paid!');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchExpenses();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/api/expenses/${id}`);
      setActionSuccess('Expense deleted.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Expenses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-surface-container border-2 border-error p-lg flex flex-col items-center gap-md max-w-md text-center shadow-[6px_6px_0px_0px_rgba(239,68,68,0.2)]">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <h3 className="font-headline-md text-[18px] text-white uppercase">Connection Failed</h3>
          <p className="font-body-md text-[12px] text-on-surface/60">{error}</p>
          <button onClick={fetchExpenses} className="bg-error text-white font-label-bold text-[12px] px-md py-sm uppercase hover:bg-white hover:text-black transition-colors active:scale-95">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-md lg:space-y-lg relative pb-32">
      {actionSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container p-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div>
          <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Financial Overview</p>
          <h1 className="text-3xl font-heading font-bold text-on-surface uppercase tracking-tight">Expenses Tracker</h1>
          <p className="text-on-surface/60 font-body text-sm mt-1">Monitor gym operating costs and bills.</p>
        </div>
        <button onClick={() => handleOpenForm()} className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Expense
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter">
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700">account_balance_wallet</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Monthly</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface"><AnimCount value={totalMonthly} prefix="₹" /></h2>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-green-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700">check_circle</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Paid</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface"><AnimCount value={totalPaid} prefix="₹" /></h2>
            </div>
          </div>
          {paidPercentage > 0 && (
             <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${paidPercentage}%` }}></div>
              </div>
              <span className="text-green-500 text-xs font-bold whitespace-nowrap">{paidPercentage}%</span>
            </div>
          )}
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-yellow-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700">pending_actions</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Pending</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface"><AnimCount value={totalPending} prefix="₹" /></h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="text-yellow-500 text-xs font-bold">{pendingCount} Bills</span>
             <span className="text-on-surface/40 text-xs">Awaiting</span>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-error/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-error/15 group-hover:text-error/50 transition-all duration-700">warning</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Overdue</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface"><AnimCount value={totalOverdue} prefix="₹" /></h2>
            </div>
          </div>
          {totalOverdue > 0 && (
            <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
               <span className="text-error text-[16px] material-symbols-outlined">error</span>
               <span className="text-on-surface/60 text-[10px] uppercase font-bold">Requires attention</span>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col sm:flex-row gap-sm">
        <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors">
          <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search expenses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
          />
        </div>
        <div className="flex gap-sm">
          <div className="bg-surface-container border border-white/[0.06]">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none cursor-pointer">
              <option value="All" className="bg-[#1A1A1A]">All Categories</option>
              <option value="Rent" className="bg-[#1A1A1A]">Rent</option>
              <option value="Utilities" className="bg-[#1A1A1A]">Utilities</option>
              <option value="Payroll" className="bg-[#1A1A1A]">Payroll</option>
              <option value="Equipment" className="bg-[#1A1A1A]">Equipment</option>
              <option value="Maintenance" className="bg-[#1A1A1A]">Maintenance</option>
              <option value="Marketing" className="bg-[#1A1A1A]">Marketing</option>
              <option value="Supplies" className="bg-[#1A1A1A]">Supplies</option>
              <option value="Other" className="bg-[#1A1A1A]">Other</option>
            </select>
          </div>
          <div className="bg-surface-container border border-white/[0.06]">
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none cursor-pointer">
              <option value="All" className="bg-[#1A1A1A]">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.name} className="bg-[#1A1A1A]">{b.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface-container border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Date</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Category</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Description</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Amount</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Status</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Branch</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <td className="py-sm px-md text-sm text-on-surface/70">
                    {new Date(exp.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {exp.is_recurring && <span className="material-symbols-outlined text-[12px] text-primary-container ml-1" title="Recurring Expense">autorenew</span>}
                  </td>
                  <td className="py-sm px-md">
                    <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-primary-container/30 group-hover:text-primary-container transition-colors whitespace-nowrap">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-sm px-md">
                    <span className="font-bold text-on-surface text-sm uppercase">{exp.description}</span>
                  </td>
                  <td className="py-sm px-md">
                    <span className="font-bold text-primary-container text-sm">₹{parseFloat(exp.amount).toLocaleString()}</span>
                  </td>
                  <td className="py-sm px-md">
                    <span className={`inline-block px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-sm px-md text-sm text-on-surface/50">{exp.branchName}</td>
                  <td className="py-sm px-md text-right">
                    <div className="flex justify-end gap-1">
                      {exp.status !== 'PAID' && (
                        <button onClick={() => handleOpenMarkPaid(exp)} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-green-500 hover:bg-green-500/10 transition-all" title="Mark as Paid">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                      )}
                      <button onClick={() => handleOpenForm(exp)} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-primary-container hover:bg-primary-container/10 transition-all" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-error hover:bg-error/10 transition-all" title="Delete">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-xl text-center text-on-surface/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 block opacity-30">receipt_long</span>
                    <p className="font-label-bold text-[11px] uppercase tracking-wider">No expenses found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface-container border border-white/10 w-full max-w-lg relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
            <div className="p-md flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">{editId ? 'Update Record' : 'New Record'}</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>

            {actionError && (
              <div className="mx-md bg-error/10 border border-error/20 text-error px-md py-sm font-label-bold text-[10px] uppercase flex items-center gap-sm">
                <span className="material-symbols-outlined text-[14px]">error</span>{actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-md space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-[6px] col-span-2 sm:col-span-1">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none">
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Payroll">Payroll</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[6px] col-span-2 sm:col-span-1">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Amount (₹) *</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none" />
                </div>
                <div className="flex flex-col gap-[6px] col-span-2">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Description *</label>
                  <input type="text" placeholder="e.g. November Rent" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none" />
                </div>
                <div className="flex flex-col gap-[6px] col-span-2 sm:col-span-1">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Due Date *</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none" />
                </div>
                <div className="flex flex-col gap-[6px] col-span-2 sm:col-span-1">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none">
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[6px] col-span-2">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Branch (Optional)</label>
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 outline-none">
                    <option value="">None / System Wide</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="col-span-2 flex items-center gap-sm mt-sm">
                  <input type="checkbox" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 accent-primary-container" />
                  <label htmlFor="isRecurring" className="text-[13px] text-on-surface cursor-pointer select-none font-bold">Make this a recurring monthly expense</label>
                </div>
              </div>

              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-md py-sm border border-white/10 font-label-bold text-[11px] uppercase text-on-surface/50 hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-md py-sm bg-primary-container text-on-primary font-label-bold text-[11px] uppercase hover:brightness-110 flex items-center gap-xs">
                  {actionLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {isMarkPaidOpen && paidExpense && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface-container border border-white/10 w-full max-w-sm relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            <div className="p-md flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-green-500 uppercase tracking-[0.3em] mb-xs">Quick Action</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">Mark as Paid</h2>
              </div>
              <button onClick={() => setIsMarkPaidOpen(false)} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <form onSubmit={handleMarkPaid} className="p-md space-y-md">
              <div className="bg-white/5 p-sm border border-white/10 rounded-sm">
                <p className="text-[12px] text-on-surface/60">Paying:</p>
                <p className="font-bold text-white text-[16px]">{paidExpense.description}</p>
                <p className="font-bold text-primary-container text-[20px] mt-1">₹{parseFloat(paidExpense.amount).toLocaleString()}</p>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="font-label-bold text-[10px] uppercase text-on-surface/40">Payment Method *</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-green-500/50 outline-none">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end">
                <button type="submit" disabled={actionLoading} className="w-full py-sm bg-green-500 text-black font-label-bold text-[12px] uppercase hover:brightness-110 flex items-center justify-center gap-xs">
                  {actionLoading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Expenses;
