import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function Announcements() {
  // Data states
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Transform API data for display
  const displayAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    date: a.published_at
      ? new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
      : '-',
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
      setActionLoading(true);
      setActionError(null);
      await api.post('/api/announcements', {
        title,
        message: content,
        target_role: targetRole || null,
      });

      // Reset Form
      setTitle('');
      setContent('');
      setTargetRole('');
      setIsFormOpen(false);

      // Refresh data
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setActionError(err.response?.data?.error || 'Failed to create announcement.');
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
          <span className="font-label-bold text-outline uppercase tracking-wider">Loading Announcements...</span>
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
          <button onClick={fetchAnnouncements} className="brutalist-border px-lg py-sm font-label-bold uppercase hover:bg-surface-container-highest transition-colors">
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
          <p className="font-label-bold text-primary-container uppercase tracking-widest mb-xs text-xs">Member Communication</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase">ANNOUNCEMENTS</h3>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary-container text-on-primary-container px-lg py-sm font-headline-md text-headline-md uppercase flex items-center justify-center gap-xs hover:scale-105 active:scale-95 transition-transform shrink-0 self-start sm:self-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          <span className="material-symbols-outlined">add</span>
          NEW BROADCAST
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="flex items-center bg-surface-container-low brutalist-border brutalist-border-focus group px-sm max-w-md mb-lg">
        <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary-container transition-colors">search</span>
        <input
          type="text"
          placeholder="SEARCH ANNOUNCEMENTS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-label-bold py-md placeholder:text-outline-variant/60 uppercase"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-md">
        {filteredAnnouncements.map((ann) => (
          <div key={ann.id} className="bg-surface-container border border-white/10 p-md lg:p-lg flex flex-col justify-between relative overflow-hidden group hover:border-primary-container transition-colors">
            {/* Status vertical line */}
            <div className={`absolute top-0 left-0 w-1 h-full ${
              ann.status === 'Active' ? 'bg-primary-container' : 'bg-outline/50'
            }`}></div>

            <div className="flex flex-wrap items-center justify-between gap-sm mb-sm pl-xs">
              <div className="flex items-center gap-sm">
                <span className="font-label-bold text-[10px] uppercase tracking-wider text-outline">{ann.date}</span>
                <span className={`brutalist-border px-xs py-1 font-label-bold text-[9px] uppercase ${
                  ann.status === 'Active' ? 'text-primary border-primary' : 'text-outline border-outline'
                }`}>
                  {ann.status}
                </span>
                {ann.isPinned && (
                  <span className="text-[10px] font-label-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-xs py-1">
                    📌 Pinned
                  </span>
                )}
              </div>
              <span className="text-[10px] font-label-bold uppercase tracking-widest text-primary-container bg-primary-container/10 px-xs py-1">
                {ann.targetRole}
              </span>
            </div>

            <h4 className="font-headline-md text-headline-md text-white uppercase mb-xs pl-xs">{ann.title}</h4>
            <p className="font-body-md text-body-md text-on-surface opacity-80 pl-xs leading-relaxed">{ann.content}</p>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-surface-container border border-white/10 py-lg text-center font-label-bold text-outline uppercase">
            No Announcements Found
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-margin-mobile">
          <div className="bg-surface border border-white/20 p-md lg:p-lg w-full max-w-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>

            <div className="flex justify-between items-start mb-lg">
              <div>
                <h1 className="font-headline-lg text-headline-lg uppercase text-on-surface">BROADCAST BULLETIN</h1>
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
              <div className="space-y-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none font-body-md"
                  >
                    <option value="">Everyone</option>
                    <option value="member">Members Only</option>
                    <option value="trainer">Trainers Only</option>
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Bulletin Title</label>
                  <input
                    type="text"
                    placeholder="E.G. NEW CLASS TIME CHANGES"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface placeholder:text-outline/50 focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md uppercase"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-bold text-label-bold uppercase text-secondary">Message Content</label>
                  <textarea
                    rows="5"
                    placeholder="ENTER BULLETIN MESSAGE TO SEND..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface placeholder:text-outline/50 focus:border-primary-container focus:ring-0 outline-none transition-all font-body-md uppercase resize-none"
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
                  {actionLoading ? 'SENDING...' : 'SEND BULLETIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
