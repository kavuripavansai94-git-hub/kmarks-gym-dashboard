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

export default function Trainers() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrainerId, setEditingTrainerId] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Weight Training');
  const [joinedDate, setJoinedDate] = useState('');
  const [certifications, setCertifications] = useState('');

  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [trainersRes, membersRes] = await Promise.all([
        api.get('/api/trainers'),
        api.get('/api/members')
      ]);
      setTrainers(trainersRes.data.trainers || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
      setError('Failed to load trainers. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrainers(); }, [fetchTrainers]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && trainers.length > 0 && !isFormOpen) {
      const t = trainers.find(trainer => trainer.id === editId);
      if (t) {
        setName(t.name);
        setEmail(t.email);
        setPhone(t.phone);
        setSpecialty(t.specialty);
        setJoinedDate(t.joined_at ? new Date(t.joined_at).toISOString().split('T')[0] : '');
        setCertifications(t.certifications || '');
        setEditingTrainerId(t.id);
        setIsFormOpen(true);
        navigate('/trainers', { replace: true });
      }
    }
  }, [location.search, trainers, isFormOpen, navigate]);

  const totalStaff = trainers.length;
  const uniqueSpecialties = new Set(trainers.map(t => t.specialization).filter(Boolean)).size;
  const totalAssignedMembers = members.filter(m => m.assigned_trainer_id).length;

  const displayTrainers = trainers.map((t) => {
    const user = t.users || {};
    const assignedCount = members.filter(m => m.assigned_trainer_id === t.user_id).length;
    return {
      id: t.id,
      user_id: t.user_id,
      name: user.name || 'Unknown',
      email: user.email || '',
      phone: user.phone || '-',
      specialty: t.specialization || '-',
      joinedDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : '-',
      assignedCount
    };
  });

  const filteredTrainers = displayTrainers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      const payload = {
        name, email, phone, specialty,
        joined_at: joinedDate, certifications: certifications || null
      };
      if (editingTrainerId) {
        await api.put(`/api/trainers/${editingTrainerId}`, payload);
        setActionSuccess(`${name} updated successfully!`);
      } else {
        await api.post('/api/trainers', payload);
        setActionSuccess(`${name} added successfully!`);
      }
      setName(''); setEmail(''); setPhone(''); setSpecialty('Weight Training'); setJoinedDate(''); setCertifications('');
      setEditingTrainerId(null);
      setIsFormOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchTrainers();
    } catch (err) {
      setActionError(err.response?.data?.error || `Failed to ${editingTrainerId ? 'update' : 'add'} trainer.`);
    } finally { setActionLoading(false); }
  };

  const handleEditClick = (trainer) => {
    setName(trainer.name);
    setEmail(trainer.email);
    setPhone(trainer.phone);
    setSpecialty(trainer.specialty);
    setJoinedDate(trainer.joined_at ? new Date(trainer.joined_at).toISOString().split('T')[0] : '');
    setCertifications(trainer.certifications || '');
    setEditingTrainerId(trainer.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (trainerId, trainerName) => {
    if (!window.confirm(`Are you sure you want to remove trainer ${trainerName}? This will also delete their login account.`)) return;
    try {
      setActionLoading(true); setActionError(null);
      await api.delete(`/api/trainers/${trainerId}`);
      setActionSuccess(`${trainerName} has been removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchTrainers();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete trainer.');
    } finally { setActionLoading(false); }
  };

  const openAddForm = () => {
    setName(''); setEmail(''); setPhone(''); setSpecialty('Weight Training');
    const today = new Date().toISOString().split('T')[0];
    setJoinedDate(today); setCertifications('');
    setEditingTrainerId(null);
    setIsFormOpen(true);
    setActionError(null);
  };

  const handleCloseForm = () => {
    setName(''); setEmail(''); setPhone(''); setSpecialty('Weight Training');
    setJoinedDate(''); setCertifications('');
    setEditingTrainerId(null);
    setIsFormOpen(false);
    setActionError(null);
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Trainers...</span>
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
          <button onClick={fetchTrainers} className="bg-error text-white font-label-bold text-[12px] px-md py-sm uppercase hover:bg-white hover:text-black transition-colors active:scale-95">
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
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Staff Directory</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              Trainers
              <span className="text-primary-container ml-sm text-[20px]">({totalStaff})</span>
            </h1>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={openAddForm}
              className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Trainer
            </button>
            <button
              onClick={fetchTrainers}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-sm lg:gap-gutter">
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">groups</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Total Staff</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-white leading-none mt-xs tracking-tighter">
                <AnimCount value={totalStaff} />
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-[18px]">groups</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">assignment_ind</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Members Assigned</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-primary-container leading-none mt-xs tracking-tighter">
                <AnimCount value={totalAssignedMembers} />
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-[18px]">groups</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all hidden md:block">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">fitness_center</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Specializations</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-white leading-none mt-xs tracking-tighter">
                <AnimCount value={uniqueSpecialties} />
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-[18px]">fitness_center</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <section className="flex flex-col sm:flex-row gap-sm">
        <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors">
          <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search by trainer name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="material-symbols-outlined text-on-surface/30 hover:text-white text-[18px] transition-colors">close</button>
          )}
        </div>
      </section>

      {/* ─── Trainers Table ─── */}
      <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Trainer</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden md:table-cell">Phone</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Specialty</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-center hidden md:table-cell">Members Assigned</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Joined</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.map((trainer, idx) => (
                <tr 
                  key={trainer.id} 
                  onClick={() => navigate(`/trainers/${trainer.id}`)}
                  className={`group hover:bg-white/[0.02] cursor-pointer transition-colors ${idx < filteredTrainers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                >
                  <td className="py-sm px-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary-container/40 transition-colors">
                        <span className="font-headline-md text-[16px] text-primary-container">{trainer.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-md text-[14px] font-bold text-white uppercase truncate leading-tight">{trainer.name}</p>
                        <p className="font-label-sm text-[10px] text-on-surface/35 truncate">{trainer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-sm px-md font-body-md text-[12px] text-on-surface/50 hidden md:table-cell">{trainer.phone}</td>
                  <td className="py-sm px-md">
                    <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-primary-container/30 group-hover:text-primary-container transition-colors whitespace-nowrap">
                      {trainer.specialty}
                    </span>
                  </td>
                  <td className="py-sm px-md font-body-md text-[13px] font-bold text-center text-white hidden md:table-cell">
                    <span className="bg-primary-container/10 text-primary-container border border-primary-container/20 px-sm py-[3px] font-label-bold text-[10px]">
                      {trainer.assignedCount}
                    </span>
                  </td>
                  <td className="py-sm px-md font-body-md text-[12px] text-on-surface/35 hidden lg:table-cell">{trainer.joinedDate}</td>
                  <td className="py-sm px-md text-right">
                    <div className="flex justify-end gap-xs">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(trainer); }}
                        disabled={actionLoading}
                        className="w-8 h-8 flex items-center justify-center text-on-surface/20 hover:text-primary-container hover:bg-primary-container/10 transition-all disabled:opacity-30"
                        title={`Edit ${trainer.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          let p = trainer.phone.replace(/[\s+]/g, '');
                          if(p.startsWith('91')) p = p.substring(2);
                          else if(p.startsWith('0')) p = p.substring(1);
                          window.open(`https://wa.me/91${p}`, '_blank');
                        }}
                        className="w-8 h-8 flex items-center justify-center text-on-surface/20 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all"
                        title="Message on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(trainer.id, trainer.name); }}
                        disabled={actionLoading}
                        className="w-8 h-8 flex items-center justify-center text-on-surface/20 hover:text-error hover:bg-error/10 transition-all disabled:opacity-30"
                        title={`Delete ${trainer.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrainers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-xl text-center">
                    <div className="flex flex-col items-center gap-sm">
                      <span className="material-symbols-outlined text-on-surface/15 text-[40px]">search_off</span>
                      <p className="font-label-bold text-[11px] text-on-surface/25 uppercase tracking-wider">
                        {searchTerm ? 'No matching trainers found' : 'No trainers yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add/Edit Trainer Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile" onClick={(e) => { if (e.target === e.currentTarget) { handleCloseForm(); } }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-2xl relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

            <div className="p-md lg:px-lg lg:pt-lg flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">
                  {editingTrainerId ? 'Staff Update' : 'Staff Onboarding'}
                </p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">
                  {editingTrainerId ? 'Edit Trainer' : 'Add Trainer'}
                </h2>
              </div>
              <button
                onClick={handleCloseForm}
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
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Full Name *</label>
                  <input
                    type="text" placeholder="Sarah Connor" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Email *</label>
                  <input
                    type="email" placeholder="trainer@kmarks.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Phone *</label>
                  <input
                    type="tel" placeholder="+91 98765 43210" value={phone}
                    onChange={(e) => setPhone(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Specialty *</label>
                  <div className="relative">
                    <select
                      value={specialty} onChange={(e) => setSpecialty(e.target.value)} required
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="Weight Training">Weight Training</option>
                      <option value="Bodybuilding">Bodybuilding</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Yoga">Yoga</option>
                      <option value="CrossFit">CrossFit</option>
                      <option value="Calisthenics">Calisthenics</option>
                      <option value="Nutrition">Nutrition</option>
                      <option value="Zumba">Zumba</option>
                      <option value="MMA">MMA</option>
                      <option value="Other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Joined Date *</label>
                  <input
                    type="date" value={joinedDate} onChange={(e) => setJoinedDate(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Certifications</label>
                  <input
                    type="text" placeholder="ACE, NASM, etc." value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
                  />
                </div>
              </div>

              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end">
                <button
                  type="button" onClick={handleCloseForm}
                  className="px-md py-sm border border-white/10 font-label-bold text-[11px] uppercase text-on-surface/50 hover:text-white hover:border-white/30 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="px-md py-sm bg-primary-container text-on-primary font-label-bold text-[11px] uppercase hover:brightness-110 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] disabled:opacity-50 flex items-center gap-xs"
                >
                  {actionLoading ? (
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> {editingTrainerId ? 'Saving...' : 'Adding...'}</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">{editingTrainerId ? 'save' : 'person_add'}</span> {editingTrainerId ? 'Save Changes' : 'Add Trainer'}</>
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
