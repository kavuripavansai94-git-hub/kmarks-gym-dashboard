import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Animated counter
function AnimCount({ value, dur = 600, prefix = '', suffix = '' }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) { setD(0); return; }
    let s = 0; const step = Math.ceil(value / (dur / 16));
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t); } else setD(s); }, 16);
    return () => clearInterval(t);
  }, [value, dur]);
  return <>{prefix}{d.toLocaleString()}{suffix}</>;
}

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [attendanceRes, membersRes] = await Promise.all([
        api.get('/api/attendance'), api.get('/api/members'),
      ]);
      setAttendance(attendanceRes.data.attendance || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load attendance. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stats
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayAttendance = attendance.filter(a => new Date(a.check_in) >= todayStart);
  const activeInGym = todayAttendance.filter(a => !a.check_out).length;
  const totalScansToday = todayAttendance.length;
  const capacityPct = Math.round((activeInGym / 150) * 100);

  const displayAttendance = attendance.map((a) => {
    const user = a.users || {};
    const checkInDate = new Date(a.check_in);
    return {
      id: a.id,
      memberName: user.name || 'Unknown',
      time: checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: checkInDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
      checkOut: a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      status: a.check_out ? 'Checked Out' : 'Checked In',
    };
  });

  const filteredAttendance = displayAttendance.filter(a =>
    a.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttendance = filteredAttendance.slice(startIndex, startIndex + itemsPerPage);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    try {
      setActionLoading(true); setActionError(null); setActionSuccess(null);
      const member = members.find(m => m.id === selectedMemberId);
      const memberId = member?.user_id || selectedMemberId;
      await api.post('/api/attendance', { member_id: memberId, date: new Date().toISOString() });
      setSelectedMemberId('');
      setActionSuccess(`${member?.users?.name || 'Member'} checked in successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to check in member.');
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Attendance...</span>
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
          <button onClick={fetchData} className="bg-error text-white font-label-bold text-[12px] px-md py-sm uppercase hover:bg-white hover:text-black transition-colors active:scale-95">Retry</button>
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
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Facility Management</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">Attendance Log</h1>
          </div>
          <button onClick={fetchData} className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm lg:gap-gutter">
        <div className="group relative bg-surface-container border border-primary-container/30 p-sm lg:p-md overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container"></div>
          <div className="flex items-center justify-between mb-sm">
            <p className="font-label-bold text-[9px] lg:text-[10px] text-primary-container uppercase tracking-[0.15em]">Active In Gym Now</p>
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center rounded-full animate-pulse">
              <span className="w-2 h-2 bg-primary-container rounded-full"></span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-headline-xl text-[24px] lg:text-[32px] text-primary-container leading-none tracking-tighter">
              <AnimCount value={activeInGym} />
            </p>
            <div className="text-right">
              <p className="font-label-bold text-[10px] text-on-surface/50 uppercase">Capacity</p>
              <p className="font-body-md text-[13px] text-white">{capacityPct}%</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Today's Total Scans</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-white leading-none mt-xs tracking-tighter"><AnimCount value={totalScansToday} /></p>
            </div>
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/50 text-[18px]">qr_code_scanner</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-bold text-[9px] lg:text-[10px] text-on-surface/40 uppercase tracking-[0.15em]">Total Records</p>
              <p className="font-headline-xl text-[24px] lg:text-[32px] text-white leading-none mt-xs tracking-tighter"><AnimCount value={attendance.length} /></p>
            </div>
            <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/50 text-[18px]">history</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Check-In Simulator ─── */}
      <section className="bg-surface-container border border-white/[0.06] p-md lg:p-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-primary-container text-[20px]">how_to_reg</span>
          <h4 className="font-headline-md text-[14px] text-white uppercase tracking-wider">Manual Check-In Simulator</h4>
        </div>
        <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-md max-w-3xl">
          <div className="relative flex-grow">
            <select
              value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md appearance-none"
            >
              <option value="">-- SELECT MEMBER TO SCAN IN --</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.users?.name || 'Member'} - ID: {m.id.substring(0,6).toUpperCase()}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20 text-[18px]">expand_more</span>
          </div>
          <button
            type="submit" disabled={actionLoading || !selectedMemberId}
            className="bg-primary-container text-on-primary font-label-bold text-[11px] px-lg py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] disabled:opacity-50 shrink-0 flex items-center justify-center gap-xs"
          >
            {actionLoading ? <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>}
            {actionLoading ? 'Scanning...' : 'Simulate Scan'}
          </button>
        </form>
      </section>

      {/* ─── Attendance Log Table ─── */}
      <section className="space-y-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
          <div className="flex-grow flex items-center bg-surface-container border border-white/[0.06] group px-sm focus-within:border-primary-container/50 transition-colors w-full sm:max-w-md">
            <span className="material-symbols-outlined text-on-surface/30 group-focus-within:text-primary-container transition-colors text-[20px]">search</span>
            <input
              type="text" placeholder="Search members..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[13px] py-sm placeholder:text-on-surface/25 pl-sm"
            />
            {searchTerm && <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="material-symbols-outlined text-on-surface/30 hover:text-white text-[18px] transition-colors">close</button>}
          </div>
        </div>

        <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Date</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Check-in Time</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Check-out</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttendance.map((log, idx) => (
                  <tr key={log.id} className={`group hover:bg-white/[0.02] transition-colors ${idx < paginatedAttendance.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                    <td className="py-sm px-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary-container/40 transition-colors">
                          <span className="font-headline-md text-[14px] text-primary-container">{log.memberName.charAt(0)}</span>
                        </div>
                        <span className="font-body-md text-[13px] font-bold text-white uppercase truncate">{log.memberName}</span>
                      </div>
                    </td>
                    <td className="py-sm px-md font-body-md text-[13px] text-on-surface/60">{log.date}</td>
                    <td className="py-sm px-md font-body-lg text-[14px] font-bold text-white">{log.time}</td>
                    <td className="py-sm px-md font-body-md text-[13px] text-on-surface/40">{log.checkOut || '-'}</td>
                    <td className="py-sm px-md text-center">
                      <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                        log.status === 'Checked In' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-on-surface/40 border border-white/10'
                      }`}>
                        {log.status === 'Checked In' && <span className="w-[5px] h-[5px] rounded-full bg-green-500"></span>}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedAttendance.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-xl text-center">
                      <div className="flex flex-col items-center gap-sm">
                        <span className="material-symbols-outlined text-on-surface/15 text-[40px]">history</span>
                        <p className="font-label-bold text-[11px] text-on-surface/25 uppercase tracking-wider">{searchTerm ? 'No matching records found' : 'No attendance records yet'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-sm">
            <p className="font-label-bold text-[10px] text-on-surface/30 uppercase">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length}</p>
            <div className="flex items-center gap-[4px]">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center border border-white/[0.06] text-on-surface/40 hover:text-primary-container hover:border-primary-container/30 transition-all disabled:opacity-20 disabled:pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                  return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 font-label-bold text-[11px] transition-all ${currentPage === page ? 'bg-primary-container/15 text-primary-container border border-primary-container/30' : 'text-on-surface/30 hover:text-primary-container border border-transparent'}`}>{page}</button>;
                }
                if (page === 2 && currentPage > 3) return <span key="dots-start" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
                if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key="dots-end" className="text-on-surface/20 px-[4px] text-[10px]">…</span>;
                return null;
              })}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center border border-white/[0.06] text-on-surface/40 hover:text-primary-container hover:border-primary-container/30 transition-all disabled:opacity-20 disabled:pointer-events-none"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
