import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function Attendance() {
  // Data states
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch attendance and members from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [attendanceRes, membersRes] = await Promise.all([
        api.get('/api/attendance'),
        api.get('/api/members'),
      ]);
      setAttendance(attendanceRes.data.attendance || []);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAttendance = attendance.filter(a => {
    const checkIn = new Date(a.check_in);
    return checkIn >= todayStart;
  });
  const activeInGym = todayAttendance.filter(a => !a.check_out).length;
  const totalScansToday = todayAttendance.length;
  const capacityPct = Math.round((activeInGym / 150) * 100);

  // Transform API attendance data for display
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

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      // Find the member's user_id
      const member = members.find(m => m.id === selectedMemberId);
      const memberId = member?.user_id || selectedMemberId;

      await api.post('/api/attendance', {
        member_id: memberId,
        date: new Date().toISOString(),
      });

      setSelectedMemberId('');
      setActionSuccess(`${member?.users?.name || 'Member'} checked in successfully!`);

      // Refresh data
      await fetchData();

      // Clear success after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      setActionError(err.response?.data?.error || 'Failed to check in member.');
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
          <span className="font-label-bold text-outline uppercase tracking-wider">Loading Attendance...</span>
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
          <button onClick={fetchData} className="brutalist-border px-lg py-sm font-label-bold uppercase hover:bg-surface-container-highest transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg p-md lg:p-0">
      {/* Action feedback */}
      {actionError && (
        <div className="bg-error/10 border border-error text-error px-md py-sm font-label-bold uppercase flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="material-symbols-outlined text-[18px]">close</button>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-md py-sm font-label-bold uppercase flex justify-between items-center">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="material-symbols-outlined text-[18px]">close</button>
        </div>
      )}

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-lg">
        <div className="bg-surface-container border border-primary-container p-md flex flex-col justify-between">
          <span className="font-label-bold text-primary-container uppercase text-[12px]">In Gym Now</span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-xl text-headline-xl text-primary-container">{activeInGym}</span>
            <span className="font-label-bold text-outline text-[12px] uppercase">CAPACITY: {capacityPct}%</span>
          </div>
        </div>
        <div className="bg-surface-container border border-white/10 p-md flex flex-col justify-between">
          <span className="font-label-bold text-outline uppercase text-[12px]">Today's Total Scans</span>
          <span className="font-headline-xl text-headline-xl text-on-surface">{totalScansToday}</span>
        </div>
        <div className="bg-surface-container border border-white/10 p-md flex flex-col justify-between">
          <span className="font-label-bold text-outline uppercase text-[12px]">Total Records</span>
          <span className="font-headline-xl text-headline-xl text-on-surface">{attendance.length}</span>
        </div>
      </div>

      {/* Simulator Block */}
      <section className="bg-surface-container border border-white/15 p-md lg:p-lg">
        <h4 className="font-headline-md text-headline-md text-white uppercase mb-sm">RFID / Barcode Check-In Simulator</h4>
        <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-md max-w-xl">
          <div className="relative flex-grow">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-on-surface/20 px-md py-sm text-on-surface focus:border-primary-container focus:ring-0 outline-none font-body-md"
            >
              <option value="">-- SELECT MEMBER TO SCAN --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.users?.name || 'Member'}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={actionLoading || !selectedMemberId}
            className="bg-primary-container text-black font-headline-md text-headline-md px-lg py-sm uppercase hover:bg-white transition-colors active:scale-95 text-center shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50"
          >
            {actionLoading ? 'SCANNING...' : 'SIMULATE SCAN'}
          </button>
        </form>
      </section>

      {/* Live Check-in Feed */}
      <section className="space-y-base">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
          <h3 className="font-headline-md text-headline-md text-white uppercase tracking-tight">Attendance Log</h3>
          <div className="flex items-center bg-surface-container-low brutalist-border brutalist-border-focus group px-sm w-full sm:w-72">
            <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary-container transition-colors">search</span>
            <input
              type="text"
              placeholder="SEARCH MEMBERS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-label-bold py-sm placeholder:text-outline-variant/60 uppercase"
            />
          </div>
        </div>

        <div className="bg-surface-container border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline bg-surface-container-low">
                  <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Member</th>
                  <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Date</th>
                  <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Check-in Time</th>
                  <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider">Check-out</th>
                  <th className="px-md py-sm font-label-bold text-outline uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {filteredAttendance.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-high transition-colors group">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 border border-outline group-hover:border-primary-container shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                          <span className="font-headline-md text-primary-container">{log.memberName.charAt(0)}</span>
                        </div>
                        <span className="font-body-lg font-bold text-white uppercase">{log.memberName}</span>
                      </div>
                    </td>
                    <td className="px-md py-md font-body-md text-on-surface">{log.date}</td>
                    <td className="px-md py-md font-body-lg font-bold text-primary-container">{log.time}</td>
                    <td className="px-md py-md font-body-md text-on-surface-variant">{log.checkOut || '-'}</td>
                    <td className="px-md py-md text-center">
                      <span className={`brutalist-border px-sm py-xs font-label-bold text-[10px] uppercase ${
                        log.status === 'Checked In'
                          ? 'bg-green-500/10 text-green-500 border-green-500'
                          : 'bg-outline/10 text-outline border-outline'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-lg text-center font-label-bold text-outline uppercase">
                      No Attendance Records Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
