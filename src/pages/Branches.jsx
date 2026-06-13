import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const MOCK_BRANCHES = [
  { id: 1, name: "K Mark's Gym", location: 'Guntur, Andhra Pradesh', manager: 'Admin', status: 'Active', contact: '' },
];

function Branches() {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [managerId, setManagerId] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('500');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, trainersRes, branchesRes] = await Promise.all([
        api.get('/api/members'),
        api.get('/api/trainers'),
        api.get('/api/branches')
      ]);
      setTotalMembers(membersRes.data.members?.length || 0);
      
      const fetchedTrainers = trainersRes.data.trainers || [];
      setTotalStaff(fetchedTrainers.length);
      setTrainers(fetchedTrainers);

      setBranches(branchesRes.data.branches || []);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingBranch(null);
    setName('');
    setLocation('');
    setStatus('ACTIVE');
    setManagerId('');
    setMaxCapacity('500');
    setContactPhone('');
    setContactEmail('');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditForm = (branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setLocation(branch.location || '');
    setStatus(branch.status || 'ACTIVE');
    setManagerId(branch.manager_id || '');
    setMaxCapacity(branch.max_capacity?.toString() || '500');
    setContactPhone(branch.contact_phone || '');
    setContactEmail(branch.contact_email || '');
    setAddress(branch.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        location,
        status,
        manager_id: managerId || null,
        max_capacity: maxCapacity,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        address
      };

      if (editingBranch) {
        const res = await api.put(`/api/branches/${editingBranch.id}`, payload);
        const updated = res.data.branch;
        setBranches(branches.map(b => b.id === updated.id ? updated : b));
      } else {
        const res = await api.post('/api/branches', payload);
        const created = res.data.branch;
        setBranches([...branches, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save branch', err);
      alert('Failed to save branch.');
    }
  };

  const handleDelete = async (id, branchName) => {
    if (!window.confirm(`Delete branch ${branchName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/branches/${id}`);
      setBranches(branches.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete branch', err);
      alert('Failed to delete branch.');
    }
  };

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    branch.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'SETUP': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'MAINTENANCE': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface border-white/10';
    }
  };

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status?.toUpperCase() === 'ACTIVE').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-gutter pb-32"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container p-md relative overflow-hidden mb-lg">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div>
          <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Location Directory</p>
          <h1 className="text-3xl font-heading font-bold text-on-surface uppercase tracking-tight">Branches</h1>
          <p className="text-on-surface/60 font-body text-sm mt-1">Manage all gym locations from one place.</p>
        </div>
        <button onClick={openAddForm} className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Branch
        </button>
      </div>

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter mb-lg">
        {/* Total Branches */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full blur-[30px] group-hover:bg-white/20 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">storefront</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Branches</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalBranches}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            <span className="text-green-500 text-xs font-bold">+1</span>
            <span className="text-on-surface/40 text-xs">this year</span>
          </div>
        </div>

        {/* Active Branches */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-green-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">check_circle</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Active Branches</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{activeBranches}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            {activeBranches > 0 ? (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (branches.reduce((sum, b) => sum + (b.member_count || 0), 0) / branches.reduce((sum, b) => sum + (b.max_capacity || 500), 0)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-green-500 text-[10px] font-bold whitespace-nowrap">
                  {Math.round((branches.reduce((sum, b) => sum + (b.member_count || 0), 0) / Math.max(1, branches.reduce((sum, b) => sum + (b.max_capacity || 500), 0))) * 100)}% Utilized
                </span>
              </div>
            ) : (
              <span className="text-on-surface/40 text-xs">No active branches</span>
            )}
          </div>
        </div>

        {/* Total Members */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-cyan-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-cyan-500/20 rounded-full blur-[30px] group-hover:bg-cyan-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-cyan-500/15 group-hover:text-cyan-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">groups</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Members</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalMembers}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="material-symbols-outlined text-cyan-500 text-[16px]">trending_up</span>
             <span className="text-on-surface/60 text-xs">Across all locations</span>
          </div>
        </div>

        {/* Total Staff */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-yellow-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-yellow-500/20 rounded-full blur-[30px] group-hover:bg-yellow-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">badge</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Staff</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalStaff}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="text-yellow-500 text-xs font-bold">Trainers & Admins</span>
          </div>
        </div>
      </section>

      {/* FILTER AND TABLE SECTION */}
      <section className="bg-surface-container border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header & Filters */}
        <div className="p-md border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-sm">
          <h2 className="font-heading font-bold text-lg text-on-surface">Location Directory</h2>
          
          <div className="flex flex-col sm:flex-row gap-sm">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search branches..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px] bg-surface border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface/50">
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Branch Name</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Location</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Manager</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Status</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Contact</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Revenue (30d)</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr 
                  key={branch.id} 
                  className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                      </div>
                      <span className="font-bold text-on-surface text-sm">{branch.name}</span>
                    </div>
                  </td>
                  <td className="p-sm text-sm text-on-surface/70">{branch.location}</td>
                  <td className="p-sm text-sm text-on-surface/70">{branch.manager_name || 'Unassigned'}</td>
                  <td className="p-sm">
                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(branch.status)}`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="p-sm">
                    <div className="flex flex-col text-xs text-on-surface/70">
                      <span>{branch.contact_phone || 'No phone'}</span>
                      <span className="opacity-50">{branch.contact_email || 'No email'}</span>
                    </div>
                  </td>
                  <td className="p-sm text-sm font-bold text-green-500">
                    ₹{(branch.monthly_revenue || 0).toLocaleString()}
                  </td>
                  <td className="p-sm text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => window.location.href = `/members?branch_id=${branch.id}`}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-cyan-500 transition-colors" 
                        title="View Members"
                      >
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                      </button>
                      <button onClick={() => openEditForm(branch)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-primary-container transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(branch.id, branch.name)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-error/20 hover:text-error transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-xl text-center text-on-surface/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 block opacity-50">search_off</span>
                    <p>No branches found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-sm bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-surface-container border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-md border-b border-white/10 flex justify-between items-center bg-surface/50">
              <h2 className="font-heading font-bold text-lg text-on-surface">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-md flex flex-col gap-md">
              <div>
                <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Branch Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                  placeholder="e.g. K Mark's Gym - Downtown"
                />
              </div>

              <div>
                <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                  placeholder="e.g. Hyderabad, TS"
                />
              </div>

              <div>
                <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SETUP">Setup</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Contact Phone</label>
                  <input 
                    type="text" 
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Contact Email</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                    placeholder="e.g. hello@gym.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Full Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 resize-none h-[60px]"
                  placeholder="e.g. 123 Main St, Hyderabad"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                  >
                    <option value="">-- Unassigned --</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-label-bold uppercase tracking-wider text-on-surface/60 mb-xs">Max Capacity</label>
                  <input 
                    type="number" 
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="flex gap-sm mt-sm">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface border border-white/10 text-on-surface font-label-bold text-[12px] py-sm uppercase rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary-container text-on-primary font-label-bold text-[12px] py-sm uppercase rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                >
                  {editingBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Branches;
