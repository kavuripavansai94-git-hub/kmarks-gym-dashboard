import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Animated counter
function AnimCount({ value, dur = 600 }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) { setD(0); return; }
    let s = 0; const step = Math.ceil(value / (dur / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t); } else setD(s); }, 16);
    return () => clearInterval(t);
  }, [value, dur]);
  return <>{d}</>;
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [membersRes, trainersRes] = await Promise.all([
        api.get('/api/members'), api.get('/api/trainers'),
      ]);
      setMembers(membersRes.data.members || []);
      setTrainers(trainersRes.data.trainers || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load members. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (isFormOpen) {
      const today = new Date().toISOString().split('T')[0];
      const ny = new Date(); ny.setFullYear(ny.getFullYear() + 1);
      setJoinDate(today); setExpiryDate(ny.toISOString().split('T')[0]);
    }
  }, [isFormOpen]);

  const computeStatus = (end) => {
    if (!end) return 'Active';
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(end);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    if (exp < today) return 'Expired';
    if (exp <= soon) return 'Expiring Soon';
    return 'Active';
  };

  const daysRemaining = (end) => {
    if (!end) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(end);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  const displayMembers = members.map((m) => {
    const user = m.users || {};
    const td = trainers.find(t => t.user_id === m.assigned_trainer_id);
    return {
      id: m.id, name: user.name || 'Unknown', email: user.email || '',
      phone: user.phone || '-', trainer: td?.users?.name || 'Self-Trained',
      joinDate: m.joined_at || '-', expiryDate: m.membership_end || '-',
      status: computeStatus(m.membership_end), daysLeft: daysRemaining(m.membership_end),
    };
  });

  // Stat computations
  const activeCount = displayMembers.filter(m => m.status === 'Active').length;
  const expiredCount = displayMembers.filter(m => m.status === 'Expired').length;
  const expSoonCount = displayMembers.filter(m => m.status === 'Expiring Soon').length;

  const filteredMembers = displayMembers.filter((member) => {
    const s = searchTerm.toLowerCase();
    const matchSearch = member.name.toLowerCase().includes(s) || member.phone.includes(s) || member.email.toLowerCase().includes(s);
    const matchStatus = !selectedStatus || member.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      await api.post('/api/members', {
        name: fullName, email, phone,
        trainer_id: trainerId || null,
        join_date: joinDate, expiry_date: expiryDate,
      });
      setFullName(''); setEmail(''); setPhone(''); setTrainerId('');
      setIsFormOpen(false); setCurrentPage(1);
      setActionSuccess(`${fullName} added successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to add member.');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the gym? This action cannot be undone.`)) return;
    try {
      setActionLoading(true); setActionError(null);
      await api.delete(`/api/members/${memberId}`);
      setActionSuccess(`${memberName} has been removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete member.');
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
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Members...</span>
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
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Member Directory</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              All Members
              <span className="text-primary-container ml-sm text-[20px]">({displayMembers.length})</span>
            </h1>
          </div>
          <div className="flex gap-sm">
            <button
              id="add-member-trigger"
              onClick={() => setIsFormOpen(true)}
              className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Member
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
      <div className="grid grid-cols-3 gap-sm lg:gap-gutter">
        <button
          onClick={() => { setSelectedStatus('active'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden ${
            selectedStatus === 'active' ? 'border-green-500/40' : 'border-white/[0.06] hover:border-green-500/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Active</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-green-500 leading-none mt-xs tracking-tighter">
                <AnimCount value={activeCount} />
              </p>
            </div>
            <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus('expiring soon'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden ${
            selectedStatus === 'expiring soon' ? 'border-yellow-500/40' : 'border-white/[0.06] hover:border-yellow-500/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Expiring</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-yellow-500 leading-none mt-xs tracking-tighter">
                <AnimCount value={expSoonCount} />
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-500 text-[18px]">schedule</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus('expired'); setCurrentPage(1); }}
          className={`group relative bg-surface-container border p-sm lg:p-md transition-all duration-300 text-left overflow-hidden ${
            selectedStatus === 'expired' ? 'border-error/40' : 'border-white/[0.06] hover:border-error/30'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Expired</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-error leading-none mt-xs tracking-tighter">
                <AnimCount value={expiredCount} />
              </p>
            </div>
            <div className="w-8 h-8 bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
            </div>
          </div>
        </button>
      </div>

      {/* ─── Search & Filters ─── */}
      <section className="flex flex-col sm:flex-row gap-sm">
        <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors">
          <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="material-symbols-outlined text-on-surface/30 hover:text-white text-[18px] transition-colors">close</button>
          )}
        </div>
        <div className="flex gap-sm">
          <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="expiring soon">Expiring Soon</option>
            </select>
          </div>
          {selectedStatus && (
            <button
              onClick={() => { setSelectedStatus(''); setCurrentPage(1); }}
              className="border border-white/10 px-sm font-label-bold text-[10px] uppercase text-on-surface/50 hover:text-primary-container hover:border-primary-container/30 transition-colors flex items-center gap-[4px]"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              Clear
            </button>
          )}
        </div>
      </section>

      {/* ─── Results Count ─── */}
      <div className="flex items-center justify-between">
        <p className="font-label-bold text-[10px] text-on-surface/40 uppercase tracking-wider">
          {filteredMembers.length === displayMembers.length
            ? `${filteredMembers.length} members`
            : `${filteredMembers.length} of ${displayMembers.length} members`
          }
        </p>
        {filteredMembers.length > 0 && (
          <p className="font-label-bold text-[10px] text-on-surface/30 uppercase">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* ─── Members Table ─── */}
      <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden md:table-cell">Phone</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Trainer</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Joined</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Expiry</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-center">Status</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member, idx) => {
                const days = member.daysLeft;
                const urgency = days !== null && days <= 7 && days >= 0;
                return (
                  <tr
                    key={member.id}
                    className={`group hover:bg-white/[0.02] transition-colors ${idx < paginatedMembers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                  >
                    {/* Member */}
                    <td className="py-sm px-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary-container/40 transition-colors">
                          <span className="font-headline-md text-[14px] text-primary-container">{member.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-body-md text-[13px] font-bold text-white uppercase truncate leading-tight">{member.name}</p>
                          <p className="font-label-sm text-[10px] text-on-surface/35 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="py-sm px-md font-body-md text-[12px] text-on-surface/50 hidden md:table-cell">{member.phone}</td>
                    {/* Trainer */}
                    <td className="py-sm px-md hidden lg:table-cell">
                      <span className="font-body-md text-[12px] text-on-surface/50">{member.trainer}</span>
                    </td>
                    {/* Joined */}
                    <td className="py-sm px-md font-body-md text-[12px] text-on-surface/35 hidden lg:table-cell">{member.joinDate}</td>
                    {/* Expiry */}
                    <td className="py-sm px-md">
                      <div>
                        <p className={`font-body-md text-[12px] ${member.status === 'Expired' ? 'text-error' : 'text-on-surface/50'}`}>
                          {member.expiryDate}
                        </p>
                        {days !== null && member.status !== 'Expired' && (
                          <p className={`font-label-bold text-[9px] uppercase ${urgency ? 'text-error' : days <= 30 ? 'text-yellow-500' : 'text-on-surface/25'}`}>
                            {days} days left
                          </p>
                        )}
                        {member.status === 'Expired' && days !== null && (
                          <p className="font-label-bold text-[9px] uppercase text-error/60">
                            {Math.abs(days)} days ago
                          </p>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-sm px-md text-center">
                      <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                        member.status === 'Active'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : member.status === 'Expired'
                          ? 'bg-error/10 text-error border border-error/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        <span className={`w-[5px] h-[5px] rounded-full ${
                          member.status === 'Active' ? 'bg-green-500' : member.status === 'Expired' ? 'bg-error' : 'bg-yellow-500'
                        }`}></span>
                        {member.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-sm px-md text-right">
                      <button
                        onClick={() => handleDelete(member.id, member.name)}
                        disabled={actionLoading}
                        className="w-8 h-8 flex items-center justify-center text-on-surface/20 hover:text-error hover:bg-error/10 transition-all disabled:opacity-30"
                        title={`Remove ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-xl text-center">
                    <div className="flex flex-col items-center gap-sm">
                      <span className="material-symbols-outlined text-on-surface/15 text-[40px]">person_off</span>
                      <p className="font-label-bold text-[11px] text-on-surface/25 uppercase tracking-wider">
                        {searchTerm || selectedStatus ? 'No matching members found' : 'No members yet'}
                      </p>
                      {!searchTerm && !selectedStatus && (
                        <button
                          onClick={() => setIsFormOpen(true)}
                          className="font-label-bold text-[10px] text-primary-container uppercase border-b border-primary-container/30 hover:border-primary-container transition-colors pb-[2px]"
                        >
                          Add your first member →
                        </button>
                      )}
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
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length}
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
              // Show first, last, current, and neighbors
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
              if (page === 2 && currentPage > 3) {
                return <span key="dots-start" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
              }
              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key="dots-end" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
              }
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

      {/* ─── Add Member Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile" onClick={(e) => { if (e.target === e.currentTarget) { setIsFormOpen(false); setActionError(null); } }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-2xl relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            {/* Gold top line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

            {/* Header */}
            <div className="p-md lg:px-lg lg:pt-lg flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">New Registration</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">Add Member</h2>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-md lg:px-lg lg:pb-lg space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {/* Full Name */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Full Name *</label>
                  <input
                    type="text" placeholder="John Doe" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                {/* Email */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Email *</label>
                  <input
                    type="email" placeholder="member@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                {/* Phone */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Phone *</label>
                  <input
                    type="tel" placeholder="+91 98765 43210" value={phone}
                    onChange={(e) => setPhone(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                {/* Trainer */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Assign Trainer</label>
                  <div className="relative">
                    <select
                      value={trainerId} onChange={(e) => setTrainerId(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="">Self-Trained</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.user_id}>{t.users?.name || 'Trainer'}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>
                {/* Join Date */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Join Date *</label>
                  <input
                    type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                {/* Expiry */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Membership End *</label>
                  <input
                    type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setActionError(null); }}
                  className="px-md py-sm border border-white/10 font-label-bold text-[11px] uppercase text-on-surface/50 hover:text-white hover:border-white/30 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="px-md py-sm bg-primary-container text-on-primary font-label-bold text-[11px] uppercase hover:brightness-110 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] disabled:opacity-50 flex items-center gap-xs"
                >
                  {actionLoading ? (
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> Adding...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">person_add</span> Add Member</>
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
