import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import api from '../services/api';

// Mini sparkline bar chart component
function SparkBars({ data, color = '#f5c200', height = 32 }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-[1px] transition-all duration-500"
          style={{
            width: 4,
            height: `${(v / max) * 100}%`,
            minHeight: 2,
            backgroundColor: color,
            opacity: 0.3 + (i / data.length) * 0.7,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Animated counter component
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);

  // Dashboard Stats States
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [overduePayments, setOverduePayments] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [recentMembers, setRecentMembers] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper: Determine plan name based on duration
  const getPlanName = (member) => {
    if (!member.joined_at || !member.membership_end) return "Standard Monthly";
    const start = new Date(member.joined_at);
    const end = new Date(member.membership_end);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 300) return "Pro Athlete Yearly";
    if (diffDays > 80) return "Strength Elite";
    if (diffDays > 25) return "Standard Monthly";
    return "Survivalist 30";
  };

  // Helper: Compute member status
  const getMemberStatus = (member) => {
    if (!member.membership_end) return "Active";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expiry = new Date(member.membership_end); expiry.setHours(0, 0, 0, 0);
    const soonThreshold = new Date(); soonThreshold.setDate(soonThreshold.getDate() + 30); soonThreshold.setHours(0, 0, 0, 0);
    if (expiry < today) return "Expired";
    if (expiry <= soonThreshold) return "Expiring Soon";
    return "Active";
  };

  // Generate mock weekly data from real counts
  const generateWeekData = (current) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const variance = Math.max(0, current + Math.floor(Math.random() * 6) - 3);
      data.push(variance);
    }
    data[6] = current;
    return data;
  };

  // Fetch all dashboard data in parallel
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, attendanceRes, paymentsRes, expiringRes, recentRes, trainersRes, allPayRes, allAttRes] = await Promise.all([
        api.get('/api/members'),
        api.get('/api/attendance?date=today'),
        api.get('/api/payments?status=overdue'),
        api.get('/api/members?expiring=soon'),
        api.get('/api/members?limit=5'),
        api.get('/api/trainers'),
        api.get('/api/payments'),
        api.get('/api/attendance'),
      ]);

      const trainersMap = {};
      (trainersRes.data.trainers || []).forEach(t => {
        if (t.user_id && t.users?.name) trainersMap[t.user_id] = t.users.name;
      });

      const mCount = membersRes.data.members ? membersRes.data.members.length : 0;
      const aCount = attendanceRes.data.attendance ? attendanceRes.data.attendance.length : 0;
      const oCount = paymentsRes.data.payments ? paymentsRes.data.payments.length : 0;
      const eCount = expiringRes.data.members ? expiringRes.data.members.length : 0;

      setTotalMembers(mCount);
      setActiveToday(aCount);
      setOverduePayments(oCount);
      setExpiringSoon(eCount);
      setAllPayments(allPayRes.data.payments || []);
      setAllAttendance(allAttRes.data.attendance || []);

      const parsedRecent = (recentRes.data.members || []).map(member => ({
        id: member.id,
        name: member.users?.name || "Unknown",
        email: member.users?.email || "",
        plan: getPlanName(member),
        trainer: trainersMap[member.assigned_trainer_id] || "Self-Trained",
        joinDate: member.joined_at || "N/A",
        status: getMemberStatus(member)
      }));
      setRecentMembers(parsedRecent);
    } catch (err) {
      console.error("Dashboard fetching error:", err);
      setError(err.response?.data?.error || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Compute revenue
  const totalRevenue = allPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Dashboard...</span>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="bg-surface-container border-2 border-error p-lg flex flex-col items-center justify-center gap-md max-w-2xl mx-auto my-lg text-center shadow-[6px_6px_0px_0px_rgba(239,68,68,0.2)]">
        <span className="material-symbols-outlined text-error" style={{ fontSize: '48px' }}>error</span>
        <div>
          <h3 className="font-headline-md text-headline-md text-white uppercase tracking-tight mb-xs">Failed to Load Dashboard</h3>
          <p className="font-body-md text-body-md text-on-surface opacity-70">{error}</p>
        </div>
        <button onClick={fetchData} className="bg-error text-white font-headline-md text-headline-md px-md py-base uppercase hover:bg-white hover:text-black transition-colors active:scale-95">
          Retry Connection
        </button>
      </div>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const memberWeekData = generateWeekData(totalMembers);
  const attendanceWeekData = generateWeekData(activeToday);

  return (
    <div className="space-y-md lg:space-y-lg">
      {/* ─── Hero Welcome Banner ─── */}
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        {/* Decorative gold accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary-container/3 rounded-full blur-2xl"></div>

        <div className="relative p-md lg:py-lg lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[11px] text-primary-container uppercase tracking-[0.3em] mb-xs flex items-center gap-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
              System Online
            </p>
            <h1 className="font-headline-lg text-[28px] lg:text-[36px] text-white uppercase tracking-tight leading-none">
              {getGreeting()}, <span className="text-primary-container">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="font-body-md text-on-surface/60 mt-xs">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="mx-sm text-primary-container/40">•</span>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => navigate('/members')}
              className="bg-primary-container text-on-primary font-label-bold text-[12px] px-md py-sm uppercase hover:brightness-110 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Member
            </button>
            <button
              onClick={() => fetchData()}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stat Cards Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter">
        {/* Total Members */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-md hover:border-primary-container/50 transition-all duration-300 cursor-pointer overflow-hidden"
          onClick={() => navigate('/members')}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-start justify-between mb-sm">
            <div>
              <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Total Members</p>
              <p className="font-headline-xl text-[40px] lg:text-[48px] text-white leading-none mt-xs tracking-tighter">
                <AnimatedNumber value={totalMembers} />
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-[22px]">group</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-sm">
            <SparkBars data={memberWeekData} height={24} />
            <span className="font-label-bold text-[10px] text-green-500 uppercase flex items-center gap-[2px]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Active
            </span>
          </div>
        </div>

        {/* Active Today */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-md hover:border-primary-container/50 transition-all duration-300 cursor-pointer overflow-hidden"
          onClick={() => navigate('/attendance')}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-start justify-between mb-sm">
            <div>
              <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Active Today</p>
              <p className="font-headline-xl text-[40px] lg:text-[48px] text-white leading-none mt-xs tracking-tighter">
                <AnimatedNumber value={activeToday} />
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-[22px]">bolt</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-sm">
            <SparkBars data={attendanceWeekData} color="#4ade80" height={24} />
            <span className="font-label-bold text-[10px] text-on-surface/40 uppercase">
              {Math.round((activeToday / Math.max(totalMembers, 1)) * 100)}% rate
            </span>
          </div>
        </div>

        {/* Payments Overdue */}
        <div className={`group relative bg-surface-container border p-md transition-all duration-300 cursor-pointer overflow-hidden ${
          overduePayments > 0 ? 'border-error/30 hover:border-error/60' : 'border-white/[0.06] hover:border-primary-container/50'
        }`}
          onClick={() => navigate('/payments')}
        >
          <div className={`absolute top-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${
            overduePayments > 0 ? 'bg-error' : 'bg-primary-container'
          }`}></div>
          {overduePayments > 0 && <div className="absolute -top-8 -right-8 w-24 h-24 bg-error/5 rounded-full blur-xl"></div>}
          <div className="flex items-start justify-between mb-sm">
            <div>
              <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Overdue</p>
              <p className={`font-headline-xl text-[40px] lg:text-[48px] leading-none mt-xs tracking-tighter ${
                overduePayments > 0 ? 'text-error' : 'text-white'
              }`}>
                <AnimatedNumber value={overduePayments} />
              </p>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center transition-colors ${
              overduePayments > 0 ? 'bg-error/10 group-hover:bg-error/20' : 'bg-primary-container/10 group-hover:bg-primary-container/20'
            }`}>
              <span className={`material-symbols-outlined text-[22px] ${overduePayments > 0 ? 'text-error animate-pulse' : 'text-primary-container'}`}>warning</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-sm">
            <div className="flex gap-[3px]">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`w-[6px] h-[6px] rounded-[1px] ${i < overduePayments ? 'bg-error/80' : 'bg-white/10'}`}></div>
              ))}
            </div>
            <span className={`font-label-bold text-[10px] uppercase ${overduePayments > 0 ? 'text-error' : 'text-green-500'}`}>
              {overduePayments > 0 ? 'Needs Action' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-md hover:border-yellow-500/40 transition-all duration-300 cursor-pointer overflow-hidden"
          onClick={() => navigate('/members')}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-start justify-between mb-sm">
            <div>
              <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Expiring Soon</p>
              <p className={`font-headline-xl text-[40px] lg:text-[48px] leading-none mt-xs tracking-tighter ${
                expiringSoon > 0 ? 'text-yellow-500' : 'text-white'
              }`}>
                <AnimatedNumber value={expiringSoon} />
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
              <span className="material-symbols-outlined text-yellow-500 text-[22px]">event_busy</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-sm">
            <div className="h-1 flex-grow bg-white/5 mr-md overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500/60 to-yellow-500 transition-all duration-1000"
                style={{ width: `${Math.min((expiringSoon / Math.max(totalMembers, 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="font-label-bold text-[10px] text-on-surface/40 uppercase whitespace-nowrap">
              {totalMembers > 0 ? Math.round((expiringSoon / totalMembers) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      {/* ─── Revenue + Activity Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm lg:gap-gutter">
        {/* Revenue Card */}
        <div className="bg-surface-container border border-white/[0.06] p-md relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-container/5 rounded-full blur-2xl"></div>
          <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em] mb-xs">Total Revenue</p>
          <p className="font-headline-xl text-[32px] lg:text-[40px] text-primary-container leading-none tracking-tighter">
            ₹<AnimatedNumber value={Math.round(totalRevenue)} />
          </p>
          <p className="font-label-bold text-[10px] text-on-surface/40 uppercase mt-sm">
            {allPayments.filter(p => p.status === 'completed').length} completed payments
          </p>
          <div className="mt-sm flex gap-[2px]">
            {allPayments.slice(0, 20).map((p, i) => (
              <div
                key={i}
                className={`w-[4px] rounded-[1px] ${p.status === 'completed' ? 'bg-primary-container' : p.status === 'pending' ? 'bg-yellow-500/50' : 'bg-error/50'}`}
                style={{ height: `${Math.min(Math.max(parseFloat(p.amount || 0) / 50, 4), 28)}px` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Weekly Activity Heatmap */}
        <div className="lg:col-span-2 bg-surface-container border border-white/[0.06] p-md">
          <div className="flex items-center justify-between mb-md">
            <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Weekly Activity</p>
            <span className="font-label-bold text-[10px] text-primary-container uppercase">{allAttendance.length} total check-ins</span>
          </div>
          <div className="grid grid-cols-7 gap-sm">
            {weekDays.map((day, i) => {
              const value = attendanceWeekData[i] || 0;
              const intensity = Math.min(value / Math.max(activeToday || 1, 1), 1);
              return (
                <div key={day} className="flex flex-col items-center gap-xs">
                  <div
                    className="w-full aspect-square flex items-center justify-center border border-white/[0.04] transition-all duration-500 hover:scale-105"
                    style={{ backgroundColor: `rgba(245, 194, 0, ${0.05 + intensity * 0.35})` }}
                  >
                    <span className="font-headline-md text-[18px] lg:text-[22px] text-white/80">{value}</span>
                  </div>
                  <span className="font-label-bold text-[9px] text-on-surface/40 uppercase">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Recent Members Table ─── */}
      <section>
        <div className="flex justify-between items-center mb-sm">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-md text-[18px] text-white uppercase tracking-tight">Recent Members</h3>
            <span className="bg-primary-container/10 text-primary-container font-label-bold text-[10px] px-sm py-[2px] uppercase">{recentMembers.length}</span>
          </div>
          <button
            onClick={() => navigate('/members')}
            className="font-label-bold text-[11px] text-on-surface/50 uppercase hover:text-primary-container transition-colors flex items-center gap-xs group"
          >
            View All
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
        <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member</th>
                <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan</th>
                <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden md:table-cell">Trainer</th>
                <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider hidden lg:table-cell">Joined</th>
                <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.map((member, idx) => (
                <tr key={member.id} className={`group hover:bg-white/[0.02] transition-colors ${idx < recentMembers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                  <td className="p-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary-container/40 transition-colors">
                        <span className="font-headline-md text-[14px] text-primary-container">{member.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-md text-[13px] font-bold text-white uppercase truncate">{member.name}</p>
                        <p className="font-label-sm text-[10px] text-on-surface/40 truncate">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-md">
                    <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-primary-container/30 group-hover:text-primary-container transition-colors">
                      {member.plan}
                    </span>
                  </td>
                  <td className="p-md font-body-md text-[12px] text-on-surface/50 hidden md:table-cell">{member.trainer}</td>
                  <td className="p-md font-body-md text-[12px] text-on-surface/40 hidden lg:table-cell">{member.joinDate}</td>
                  <td className="p-md text-right">
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
                </tr>
              ))}
              {recentMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-lg text-center font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm lg:gap-gutter">
        <button
          onClick={() => navigate('/announcements')}
          className="group bg-surface-container border border-white/[0.06] p-md text-left hover:border-primary-container/40 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center gap-sm mb-sm">
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-[18px]">campaign</span>
            </div>
            <h4 className="font-headline-md text-[14px] text-white uppercase">Broadcast</h4>
          </div>
          <p className="font-body-md text-[11px] text-on-surface/40 leading-relaxed">Send announcements to all active members via dashboard.</p>
        </button>

        <button
          onClick={async () => {
            try {
              const [membersRes, paymentsRes] = await Promise.all([api.get('/api/members'), api.get('/api/payments')]);
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                exported_at: new Date().toISOString(),
                members: membersRes.data.members,
                payments: paymentsRes.data.payments
              }, null, 2));
              const anchor = document.createElement('a');
              anchor.setAttribute("href", dataStr);
              anchor.setAttribute("download", `kmarks_report_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
            } catch (err) {
              console.error("Export failed:", err);
            }
          }}
          className="group bg-surface-container border border-white/[0.06] p-md text-left hover:border-primary-container/40 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center gap-sm mb-sm">
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-[18px]">download</span>
            </div>
            <h4 className="font-headline-md text-[14px] text-white uppercase">Export Report</h4>
          </div>
          <p className="font-body-md text-[11px] text-on-surface/40 leading-relaxed">Download member and revenue data as a JSON report.</p>
        </button>

        <button
          onClick={() => navigate('/attendance')}
          className="group bg-surface-container border border-white/[0.06] p-md text-left hover:border-primary-container/40 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center gap-sm mb-sm">
            <div className="w-8 h-8 bg-primary-container/10 flex items-center justify-center group-hover:bg-primary-container/20 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-[18px]">qr_code_scanner</span>
            </div>
            <h4 className="font-headline-md text-[14px] text-white uppercase">Check-In</h4>
          </div>
          <p className="font-body-md text-[11px] text-on-surface/40 leading-relaxed">Open the RFID / barcode scanner to check members in.</p>
        </button>
      </div>
    </div>
  );
}
