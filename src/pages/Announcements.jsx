import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const displayAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    date: a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-',
    status: a.expires_at && new Date(a.expires_at) < new Date() ? 'Expired' : 'Active',
    targetRole: a.target_role || 'Everyone',
    isPinned: a.is_pinned,
  }));

  const filteredAnnouncements = displayAnnouncements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true); setActionError(null);
      await api.post('/api/announcements', { title, message: content, target_role: targetRole || null });
      setTitle(''); setContent(''); setTargetRole(''); setIsFormOpen(false);
      setActionSuccess('Announcement broadcasted successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchAnnouncements();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to create announcement.');
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Broadcasts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-surface-container border-2 border-error p-lg flex flex-col items-center gap-md max-w-md text-center shadow-[6px_6px_0px_0px_rgba(239,68,68,0.2)]">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '48px' }}>error</span>
          <h3 className="font-headline-md text-[18px] text-white uppercase">Connection Failed</h3>
          <p className="font-body-md text-[12px] text-on-surface/60">{error}</p>
          <button onClick={fetchAnnouncements} className="bg-error text-white font-label-bold text-[12px] px-md py-sm uppercase hover:bg-white hover:text-black transition-colors active:scale-95">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-md lg:space-y-lg relative">
      {/* ─── Notification Toasts ─── */}
      {actionError && (
        <div className="bg-error/10 border border-error/30 text-error px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm"><span className="material-symbols-outlined text-[16px]">error</span><span>{actionError}</span></div>
          <button onClick={() => setActionError(null)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm"><span className="material-symbols-outlined text-[16px]">check_circle</span><span>{actionSuccess}</span></div>
          <button onClick={() => setActionSuccess(null)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}

      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-md lg:py-md lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Member Communication</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">Announcements</h1>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              New Broadcast
            </button>
            <button onClick={fetchAnnouncements} className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Search & Actions ─── */}
      <section className="flex flex-col sm:flex-row gap-sm">
        <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors w-full sm:max-w-md">
          <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
          <input
            type="text" placeholder="Search announcements..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="material-symbols-outlined text-on-surface/30 hover:text-white text-[18px] transition-colors">close</button>}
        </div>
      </section>

      {/* ─── Announcements List ─── */}
      <div className="grid grid-cols-1 gap-md">
        {filteredAnnouncements.map((ann) => (
          <div key={ann.id} className="bg-surface-container border border-white/[0.06] p-md lg:p-lg flex flex-col relative overflow-hidden group hover:border-primary-container/30 transition-colors">
            {/* Status vertical line */}
            <div className={`absolute top-0 left-0 w-[3px] h-full ${ann.status === 'Active' ? 'bg-primary-container shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'bg-white/10'}`}></div>
            
            <div className="flex flex-wrap items-center justify-between gap-sm mb-md pl-xs">
              <div className="flex items-center gap-sm">
                <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                  ann.status === 'Active' ? 'bg-primary-container/10 text-primary-container border border-primary-container/20' : 'bg-white/5 text-on-surface/40 border border-white/10'
                }`}>
                  {ann.status === 'Active' && <span className="w-[5px] h-[5px] rounded-full bg-primary-container animate-pulse"></span>}
                  {ann.status}
                </span>
                <span className="font-label-bold text-[10px] uppercase tracking-wider text-on-surface/40">{ann.date}</span>
                {ann.isPinned && (
                  <span className="flex items-center gap-[4px] text-[9px] font-label-bold uppercase text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-sm py-[3px]">
                    <span className="material-symbols-outlined text-[12px]">keep</span> Pinned
                  </span>
                )}
              </div>
              <span className="text-[9px] font-label-bold uppercase tracking-widest text-on-surface bg-white/5 border border-white/10 px-sm py-[3px]">
                Audience: <span className={ann.targetRole !== 'Everyone' ? 'text-primary-container' : ''}>{ann.targetRole}</span>
              </span>
            </div>

            <h4 className="font-headline-md text-[18px] text-white uppercase mb-sm pl-xs leading-tight tracking-tight">{ann.title}</h4>
            <p className="font-body-md text-[14px] text-on-surface/70 pl-xs leading-relaxed max-w-4xl">{ann.content}</p>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-surface-container border border-white/[0.06] py-xl flex flex-col items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-on-surface/15 text-[48px]">campaign</span>
            <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">
              {searchTerm ? 'No matching announcements found' : 'No announcements published yet'}
            </p>
          </div>
        )}
      </div>

      {/* ─── Broadcast Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-margin-mobile" onClick={(e) => { if (e.target === e.currentTarget) { setIsFormOpen(false); setActionError(null); } }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-2xl relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>

            <div className="p-md lg:px-lg lg:pt-lg flex justify-between items-start">
              <div>
                <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">New Broadcast</p>
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight leading-none">Broadcast Bulletin</h2>
              </div>
              <button onClick={() => { setIsFormOpen(false); setActionError(null); }} className="w-8 h-8 flex items-center justify-center text-on-surface/30 hover:text-white hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {actionError && (
              <div className="mx-md lg:mx-lg bg-error/10 border border-error/20 text-error px-md py-sm font-label-bold text-[10px] uppercase flex items-center gap-sm mt-md">
                <span className="material-symbols-outlined text-[14px]">error</span>{actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-md lg:px-lg lg:pb-lg space-y-md">
              <div className="space-y-md">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Target Audience</label>
                  <div className="relative">
                    <select
                      value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
                    >
                      <option value="">Everyone (All Members & Staff)</option>
                      <option value="member">Members Only</option>
                      <option value="trainer">Trainers Only</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Bulletin Title *</label>
                  <input
                    type="text" placeholder="e.g. New Class Time Changes" value={title}
                    onChange={(e) => setTitle(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md uppercase"
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Message Content *</label>
                  <textarea
                    rows="5" placeholder="Enter bulletin message to send..." value={content}
                    onChange={(e) => setContent(e.target.value)} required
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] placeholder:text-on-surface/20 focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md resize-none"
                  />
                </div>
              </div>

              <div className="pt-md border-t border-white/[0.06] flex gap-sm justify-end mt-lg">
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
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> Sending...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">campaign</span> Send Bulletin</>
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
