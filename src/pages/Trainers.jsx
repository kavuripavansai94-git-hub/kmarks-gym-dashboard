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

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Bodybuilding');

  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/api/trainers');
      setTrainers(res.data.trainers || []);
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
      setError('Failed to load trainers. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrainers(); }, [fetchTrainers]);

  const totalStaff = trainers.length;
  const uniqueSpecialties = new Set(trainers.map(t => t.specialization).filter(Boolean)).size;

  const displayTrainers = trainers.map((t) => {
    const user = t.users || {};
    return {
      id: t.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      phone: user.phone || '-',
      specialty: t.specialization || '-',
      joinedDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-',
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
      await api.post('/api/trainers', { name, email, phone, specialty });
      setName(''); setEmail(''); setPhone(''); setSpecialty('Bodybuilding');
      setIsFormOpen(false);
      setActionSuccess(`${name} added successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchTrainers();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to add trainer.');
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
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl"></div>

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
              onClick={() => setIsFormOpen(true)}
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
          <div className="flex items-center justify-between">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Active Now</p>
              <p className="font-headline-xl text-[28px] lg:text-[36px] text-primary-container leading-none mt-xs tracking-tighter">
                <AnimCount value={totalStaff} />
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-[18px]">bolt</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all hidden md:block">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between">
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
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.map((trainer, idx) => (
                <tr key={trainer.id} className={`group hover:bg-white/[0.02] transition-colors ${idx < filteredTrainers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
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
                  <td className="py-sm px-md font-body-md text-[12px] text-on-surface/35 hidden lg:table-cell">{trainer.joinedDate}</td>
                </tr>
              ))}
              {filteredTrainers.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-xl text-center">
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

      {/* ─── Add Trainer Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile" onClick={(e) => { if (e.target === e.currentTarget) { setIsFormOpen(false); setActionError(null); } }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-2xl relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

            <div className="p-md lg:px-lg lg:pt-lg flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Staff Onboarding</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">Add Trainer</h2>
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
                      <option value="Bodybuilding">Bodybuilding</option>
                      <option value="Powerlifting">Powerlifting</option>
                      <option value="High Intensity">High Intensity</option>
                      <option value="Yoga / Mobility">Yoga / Mobility</option>
                      <option value="Cardio">Cardio</option>
                      <option value="CrossFit">CrossFit</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
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
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> Adding...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">person_add</span> Add Trainer</>
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
