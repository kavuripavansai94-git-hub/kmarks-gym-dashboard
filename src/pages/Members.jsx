import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [membersRes, trainersRes] = await Promise.all([
        api.get('/api/members'), api.get('/api/trainers'),
      ]);
      setMembers(membersRes.data.members || []);
      setTrainers(trainersRes.data.trainers || []);
      try {
        const plansRes = await api.get('/api/plans');
        setPlans(plansRes.data.plans || []);
      } catch (err) {
        console.warn('Could not fetch plans:', err);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load members. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && members.length > 0 && !isFormOpen) {
      const rawMember = members.find(m => m.id === editId);
      if (rawMember) {
        setEditMemberId(rawMember.id);
        setFullName(rawMember.users?.name || '');
        setEmail(rawMember.users?.email || '');
        setPhone(rawMember.users?.phone || '');
        setTrainerId(rawMember.assigned_trainer_id || '');
        setPlanId(rawMember.plan_id || '');
        setGender(rawMember.gender || 'Male');
        setDob(rawMember.date_of_birth ? new Date(rawMember.date_of_birth).toISOString().split('T')[0] : '');
        setEmergencyContact(rawMember.emergency_contact || '');
        setMedicalNotes(rawMember.medical_notes || '');
        setJoinDate(rawMember.joined_at ? new Date(rawMember.joined_at).toISOString().split('T')[0] : '');
        setExpiryDate(rawMember.membership_end ? new Date(rawMember.membership_end).toISOString().split('T')[0] : '');
        setIsFormOpen(true);
        setActionError(null);
        navigate('/members', { replace: true });
      }
    }
  }, [location.search, members, isFormOpen, navigate]);

  useEffect(() => {
    if (isFormOpen && !editMemberId) {
      const today = new Date().toISOString().split('T')[0];
      const ny = new Date(); ny.setFullYear(ny.getFullYear() + 1);
      setJoinDate(today); setExpiryDate(ny.toISOString().split('T')[0]);
    }
  }, [isFormOpen, editMemberId]);

  const openAddForm = () => {
    setEditMemberId(null);
    setFullName(''); setEmail(''); setPhone(''); setTrainerId(''); setPlanId('');
    setGender('Male'); setDob(''); setEmergencyContact(''); setMedicalNotes('');
    const today = new Date().toISOString().split('T')[0];
    const ny = new Date(); ny.setFullYear(ny.getFullYear() + 1);
    setJoinDate(today); setExpiryDate(ny.toISOString().split('T')[0]);
    setIsFormOpen(true);
    setActionError(null);
  };

  const openEditForm = (memberData) => {
    const rawMember = members.find(m => m.id === memberData.id);
    if (!rawMember) return;
    setEditMemberId(rawMember.id);
    setFullName(rawMember.users?.name || '');
    setEmail(rawMember.users?.email || '');
    setPhone(rawMember.users?.phone || '');
    setTrainerId(rawMember.assigned_trainer_id || '');
    setPlanId(rawMember.plan_id || '');
    setGender(rawMember.gender || 'Male');
    setDob(rawMember.date_of_birth ? new Date(rawMember.date_of_birth).toISOString().split('T')[0] : '');
    setEmergencyContact(rawMember.emergency_contact || '');
    setMedicalNotes(rawMember.medical_notes || '');
    setJoinDate(rawMember.joined_at ? new Date(rawMember.joined_at).toISOString().split('T')[0] : '');
    setExpiryDate(rawMember.membership_end ? new Date(rawMember.membership_end).toISOString().split('T')[0] : '');
    setIsFormOpen(true);
    setActionError(null);
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const displayMembers = members.map((m) => {
    const user = m.users || {};
    const td = trainers.find(t => t.user_id === m.assigned_trainer_id);
    const plan = plans.find(p => p.id === m.plan_id);
    return {
      id: m.id, name: user.name || 'Unknown', email: user.email || '',
      phone: user.phone || '-', trainer: td?.users?.name || 'Self-Trained',
      planName: plan?.name || 'No Plan',
      joinDate: formatDate(m.joined_at), expiryDate: formatDate(m.membership_end),
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
    const matchPlan = !selectedPlan || member.planName === selectedPlan;
    const matchTrainer = !selectedTrainer || member.trainer === selectedTrainer;
    return matchSearch && matchStatus && matchPlan && matchTrainer;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      const payload = {
        name: fullName, email, phone,
        gender, date_of_birth: dob || null,
        emergency_contact: emergencyContact || null,
        medical_notes: medicalNotes || null,
        trainer_id: trainerId || null,
        plan_id: planId || null,
        join_date: joinDate, expiry_date: expiryDate,
      };

      if (editMemberId) {
        await api.put(`/api/members/${editMemberId}`, payload);
        setActionSuccess(`${fullName} updated successfully!`);
      } else {
        await api.post('/api/members', payload);
        setActionSuccess(`${fullName} added successfully!`);
      }
      
      setIsFormOpen(false); setEditMemberId(null); setCurrentPage(1);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || `Failed to ${editMemberId ? 'update' : 'add'} member.`);
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

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Plan', 'Trainer', 'Joined Date', 'Expiry Date', 'Status'];
    const rows = filteredMembers.map(m => [
      m.name,
      m.email,
      m.phone,
      m.planName,
      m.trainer,
      m.joinDate,
      m.expiryDate,
      m.status
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
    link.setAttribute('download', `kmarks-members-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              onClick={handleExportCSV}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-md py-sm uppercase hover:text-white hover:border-white transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <button
              id="add-member-trigger"
              onClick={openAddForm}
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
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">check_circle</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
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
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">schedule</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
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
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">cancel</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
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
        <div className="flex gap-sm flex-wrap">
          <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
            >
              <option value="" className="bg-[#1A1A1A] text-white">All Statuses</option>
              <option value="active" className="bg-[#1A1A1A] text-white">Active</option>
              <option value="expired" className="bg-[#1A1A1A] text-white">Expired</option>
              <option value="expiring soon" className="bg-[#1A1A1A] text-white">Expiring Soon</option>
            </select>
          </div>
          <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
            <select
              value={selectedPlan}
              onChange={(e) => { setSelectedPlan(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
            >
              <option value="" className="bg-[#1A1A1A] text-white">All Plans</option>
              {[...new Set(displayMembers.map(m => m.planName))].sort().map(name => (
                <option key={name} value={name} className="bg-[#1A1A1A] text-white">{name}</option>
              ))}
            </select>
          </div>
          <div className="bg-surface-container border border-white/[0.06] focus-within:border-primary-container/50 transition-colors">
            <select
              value={selectedTrainer}
              onChange={(e) => { setSelectedTrainer(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none focus:ring-0 text-on-surface font-label-bold text-[11px] py-sm px-sm uppercase appearance-none pr-lg cursor-pointer"
            >
              <option value="" className="bg-[#1A1A1A] text-white">All Trainers</option>
              <option value="Self-Trained" className="bg-[#1A1A1A] text-white">Self-Trained</option>
              {trainers.filter(t => t.users?.name).map(t => (
                <option key={t.id} value={t.users.name} className="bg-[#1A1A1A] text-white">{t.users.name}</option>
              ))}
            </select>
          </div>
          {(selectedStatus || selectedPlan || selectedTrainer) && (
            <button
              onClick={() => { setSelectedStatus(''); setSelectedPlan(''); setSelectedTrainer(''); setCurrentPage(1); }}
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
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden md:table-cell">Plan</th>
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
                    onClick={() => navigate(`/members/${member.id}`)}
                    className={`group hover:bg-white/[0.02] cursor-pointer transition-colors ${idx < paginatedMembers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
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
                    {/* Plan */}
                    <td className="py-sm px-md hidden md:table-cell">
                      <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-primary-container/30 group-hover:text-primary-container transition-colors">
                        {member.planName}
                      </span>
                    </td>
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
                    <td className="py-sm px-md text-right whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditForm(member); }}
                        disabled={actionLoading}
                        className="w-8 h-8 inline-flex items-center justify-center text-on-surface/20 hover:text-primary-container hover:bg-primary-container/10 transition-all disabled:opacity-30 mr-1"
                        title={`Edit ${member.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          let p = member.phone.replace(/[\s+]/g, '');
                          if(p.startsWith('91')) p = p.substring(2);
                          window.open(`https://wa.me/91${p}`, '_blank');
                        }}
                        className="w-8 h-8 inline-flex items-center justify-center text-on-surface/20 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all mr-1"
                        title="Message on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(member.id, member.name); }}
                        disabled={actionLoading}
                        className="w-8 h-8 inline-flex items-center justify-center text-on-surface/20 hover:text-error hover:bg-error/10 transition-all disabled:opacity-30"
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
                  <td colSpan="8" className="py-xl text-center">
                    <div className="flex flex-col items-center gap-sm">
                      <span className="material-symbols-outlined text-on-surface/15 text-[40px]">person_off</span>
                      <p className="font-label-bold text-[11px] text-on-surface/25 uppercase tracking-wider">
                        {searchTerm || selectedStatus || selectedPlan || selectedTrainer ? 'No matching members found' : 'No members yet'}
                      </p>
                      {!searchTerm && !selectedStatus && !selectedPlan && !selectedTrainer && (
                        <button
                          onClick={openAddForm}
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
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">
                  {editMemberId ? 'Edit Member' : 'Add Member'}
                </h2>
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
                {/* Gender */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Gender</label>
                  <div className="relative">
                    <select
                      value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="Male" className="bg-[#1A1A1A] text-white">Male</option>
                      <option value="Female" className="bg-[#1A1A1A] text-white">Female</option>
                      <option value="Other" className="bg-[#1A1A1A] text-white">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>
                {/* Date of Birth */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Date of Birth</label>
                  <input
                    type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                {/* Emergency Contact */}
                <div className="flex flex-col gap-[6px] md:col-span-2 lg:col-span-1">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Emergency Contact</label>
                  <input
                    type="text" placeholder="Name & Phone Number" value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
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
                      <option value="" className="bg-[#1A1A1A] text-white">Self-Trained</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.user_id} className="bg-[#1A1A1A] text-white">{t.users?.name || 'Trainer'}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>
                {/* Plan */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Select Plan</label>
                  <div className="relative">
                    <select
                      value={planId} onChange={(e) => setPlanId(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="" className="bg-[#1A1A1A] text-white">No Plan Selected</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#1A1A1A] text-white">{p.name} - ₹{p.price}/{p.duration}</option>
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
                {/* Medical Notes */}
                <div className="flex flex-col gap-[6px] md:col-span-2">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Medical Notes</label>
                  <textarea
                    placeholder="Any injuries, conditions or notes..." value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md min-h-[80px]"
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
                    <><span className="material-symbols-outlined text-[16px]">{editMemberId ? 'save' : 'person_add'}</span> {editMemberId ? 'Save Changes' : 'Add Member'}</>
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
