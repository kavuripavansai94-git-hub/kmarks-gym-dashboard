import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_EXPENSES = [
  { id: 1, date: '01 Oct 2023', category: 'Rent', description: 'Monthly Gym Rent', amount: 5000, status: 'Paid' },
  { id: 2, date: '05 Oct 2023', category: 'Equipment', description: 'New Dumbbells', amount: 850, status: 'Paid' },
  { id: 3, date: '10 Oct 2023', category: 'Utilities', description: 'Electricity Bill', amount: 420, status: 'Pending' },
  { id: 4, date: '15 Oct 2023', category: 'Marketing', description: 'Instagram Ads', amount: 300, status: 'Paid' },
  { id: 5, date: '18 Oct 2023', category: 'Maintenance', description: 'Treadmill Repair', amount: 150, status: 'Overdue' },
  { id: 6, date: '25 Oct 2023', category: 'Salary', description: 'Staff Salaries', amount: 3200, status: 'Pending' },
];

function Expenses() {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showBanner, setShowBanner] = useState(true);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Overdue': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface border-white/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-gutter pb-32"
    >
      {showBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center mb-md animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>This feature is being connected to the database. Data shown is for preview only.</span>
          </div>
          <button onClick={() => setShowBanner(false)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-sm">
        <div>
          <h1 className="text-3xl font-heading font-bold text-on-surface mb-xs">Expenses Tracker</h1>
          <p className="text-on-surface/60 font-body text-sm">Monitor gym operating costs and bills.</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Expense
        </button>
      </div>

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter mb-lg">
        {/* Total Expenses */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full blur-[30px] group-hover:bg-white/20 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">account_balance_wallet</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Monthly Expenses</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">₹9,920</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            <span className="text-error text-xs font-bold">+5%</span>
            <span className="text-on-surface/40 text-xs">vs last month</span>
          </div>
        </div>

        {/* Paid Bills */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-green-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">check_circle</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Paid</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">₹6,150</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 w-[62%] h-full rounded-full"></div>
            </div>
            <span className="text-green-500 text-xs font-bold whitespace-nowrap">62%</span>
          </div>
        </div>

        {/* Pending Bills */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-yellow-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-yellow-500/20 rounded-full blur-[30px] group-hover:bg-yellow-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">pending_actions</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Pending</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">₹3,620</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="text-yellow-500 text-xs font-bold">2 Bills</span>
             <span className="text-on-surface/40 text-xs">Awaiting Payment</span>
          </div>
        </div>

        {/* Overdue Bills */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-error/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-error/20 rounded-full blur-[30px] group-hover:bg-error/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-error/15 group-hover:text-error/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">warning</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Overdue</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">₹150</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="text-error text-[16px] material-symbols-outlined">error</span>
             <span className="text-on-surface/60 text-xs">Requires immediate attention</span>
          </div>
        </div>
      </section>

      {/* FILTER AND TABLE SECTION */}
      <section className="bg-surface-container border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header & Filters */}
        <div className="p-md border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-sm">
          <h2 className="font-heading font-bold text-lg text-on-surface">Expense History</h2>
          
          <div className="flex flex-col sm:flex-row gap-sm">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search expenses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px] bg-surface border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors"
              />
            </div>
            
            {/* Category Filter */}
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg py-2 px-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Equipment">Equipment</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Marketing">Marketing</option>
              <option value="Salary">Salary</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface/50">
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Date</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Category</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Description</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Amount</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Status</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr 
                  key={exp.id} 
                  className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-sm text-sm text-on-surface/70">{exp.date}</td>
                  <td className="p-sm">
                    <span className="px-2 py-1 bg-surface-variant text-on-surface/70 rounded-md text-xs font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-sm">
                    <span className="font-bold text-on-surface text-sm">{exp.description}</span>
                  </td>
                  <td className="p-sm">
                    <span className="font-bold text-primary-container text-sm">₹{exp.amount.toLocaleString()}</span>
                  </td>
                  <td className="p-sm">
                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="p-sm text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-green-500 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-xl text-center text-on-surface/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 block opacity-50">receipt</span>
                    <p>No expenses found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}

export default Expenses;
