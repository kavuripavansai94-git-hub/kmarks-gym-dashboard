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

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <div className="bg-surface-container border border-white/[0.06] p-md space-y-sm animate-pulse">
      <div className="h-3 bg-white/10 rounded w-1/2"></div>
      <div className="h-10 bg-white/10 rounded w-1/3"></div>
      <div className="h-3 bg-white/5 rounded w-2/3"></div>
    </div>
  );
}

// Chart/Heatmap Card Skeleton
function ChartCardSkeleton() {
  return (
    <div className="bg-surface-container border border-white/[0.06] p-md space-y-md animate-pulse h-[160px] flex flex-col justify-between">
      <div className="h-3 bg-white/10 rounded w-1/4"></div>
      <div className="h-16 bg-white/5 rounded w-full"></div>
    </div>
  );
}

// Table Skeleton
function TableSkeleton({ rows = 3, cols = 5 }) {
  return (
    <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
      <div className="p-md border-b border-white/[0.06] flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-white/10 rounded w-10 animate-pulse"></div>
      </div>
      <div className="p-md space-y-sm">
        {[...Array(rows)].map((_, r) => (
          <div key={r} className="flex gap-md py-sm border-b border-white/[0.03] animate-pulse">
            {[...Array(cols)].map((_, c) => (
              <div key={c} className="h-4 bg-white/5 rounded flex-grow"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);

  // Lists filtered on client
  const [expiringMembersList, setExpiringMembersList] = useState([]);
  const [overduePaymentsList, setOverduePaymentsList] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Actions toast & loading
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

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
  
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
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

  // Days left calculation
  const getDaysLeft = (end) => {
    if (!end) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(end);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  // Days overdue calculation
  const getDaysOverdue = (dueDateStr) => {
    if (!dueDateStr) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dueDateStr); due.setHours(0,0,0,0);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Fetch all dashboard data in parallel
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, attendanceRes, recentRes, trainersRes, allPayRes, allAttRes, plansRes] = await Promise.all([
        api.get('/api/members'),
        api.get('/api/attendance?date=today'),
        api.get('/api/members?limit=5'),
        api.get('/api/trainers'),
        api.get('/api/payments'),
        api.get('/api/attendance'),
        api.get('/api/plans').catch(err => {
          console.warn('Could not fetch plans:', err);
          return { data: { plans: [] } };
        })
      ]);

      const trainersMap = {};
      (trainersRes.data.trainers || []).forEach(t => {
        if (t.user_id && t.users?.name) trainersMap[t.user_id] = t.users.name;
      });

      const activePlans = plansRes.data.plans || [];
      setPlans(activePlans);

      const allMembers = membersRes.data.members || [];
      setMembers(allMembers);

      const mCount = allMembers.length;
      const aCount = attendanceRes.data.attendance ? attendanceRes.data.attendance.length : 0;
      
      setTotalMembers(mCount);
      setActiveToday(aCount);
      setAllPayments(allPayRes.data.payments || []);
      setAllAttendance(allAttRes.data.attendance || []);

      // Filter: Expiring Soon
      const today = new Date(); today.setHours(0,0,0,0);
      const soonThreshold = new Date(); soonThreshold.setDate(soonThreshold.getDate() + 30); soonThreshold.setHours(0,0,0,0);
      
      const expiringList = allMembers.filter(m => {
        if (!m.membership_end) return false;
        const expiry = new Date(m.membership_end); expiry.setHours(0,0,0,0);
        // Expiry within next 30 days and currently not expired
        return expiry >= today && expiry <= soonThreshold;
      });
      setExpiringMembersList(expiringList);
      setExpiringSoon(expiringList.length);

      // Filter: Overdue Payments
      const todayStr = new Date().toISOString().split('T')[0];
      const overdueList = (allPayRes.data.payments || []).filter(p => {
        const dueDate = p.due_date || p.period_end;
        return p.status === 'pending' && dueDate && dueDate < todayStr;
      });
      setOverduePaymentsList(overdueList);
      setOverduePayments(overdueList.length);

      const parsedRecent = (recentRes.data.members || []).map(member => {
        const plan = activePlans.find(p => p.id === member.plan_id);
        return {
          id: member.id,
          name: member.users?.name || "Unknown",
          email: member.users?.email || "",
          plan: plan?.name || getPlanName(member),
          trainer: trainersMap[member.assigned_trainer_id] || "Self-Trained",
          joinDate: formatDate(member.joined_at),
          status: getMemberStatus(member)
        };
      });
      setRecentMembers(parsedRecent);
    } catch (err) {
      console.error("Dashboard fetching error:", err);
      setError(err.response?.data?.error || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkPaid = async (paymentId, amount, memberName) => {
    try {
      setActionLoading(true);
      setActionError(null);
      const todayDate = new Date().toISOString().split('T')[0];
      await api.put(`/api/payments/${paymentId}`, {
        status: 'completed',
        paid_date: todayDate
      });
      setActionSuccess(`Payment of ₹${amount} for ${memberName} marked as PAID.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      console.error("Failed to update payment status:", err);
      setActionError(err.response?.data?.error || "Failed to update payment status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compute revenue
  const totalRevenue = allPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

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
              disabled={loading}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stat Cards Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Members */}
            <div className="group relative bg-surface-container border border-white/[0.06] p-md hover:border-primary-container/50 transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => navigate('/members')}
            >
              <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[80px]">group</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-start justify-between mb-sm relative z-10">
                <div>
                  <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Total Members</p>
                  <p className="font-headline-xl text-[40px] lg:text-[48px] text-white leading-none mt-xs tracking-tighter">
                    <AnimatedNumber value={totalMembers} />
                  </p>
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
            <div className="group relative bg-surface-container border border-white/[0.06] p-md transition-all duration-300 overflow-hidden">
              <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[80px]">bolt</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-start justify-between mb-sm relative z-10">
                <div>
                  <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Active Today</p>
                  <p className="font-headline-xl text-[40px] lg:text-[48px] text-white leading-none mt-xs tracking-tighter">
                    <AnimatedNumber value={activeToday} />
                  </p>
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
              <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[80px]">warning</span>
              </div>
              <div className={`absolute top-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${
                overduePayments > 0 ? 'bg-error' : 'bg-primary-container'
              }`}></div>
              {overduePayments > 0 && <div className="absolute -top-8 -right-8 w-24 h-24 bg-error/5 rounded-full blur-xl"></div>}
              <div className="flex items-start justify-between mb-sm relative z-10">
                <div>
                  <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Overdue</p>
                  <p className={`font-headline-xl text-[40px] lg:text-[48px] leading-none mt-xs tracking-tighter ${
                    overduePayments > 0 ? 'text-error' : 'text-white'
                  }`}>
                    <AnimatedNumber value={overduePayments} />
                  </p>
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
              <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[80px]">schedule</span>
              </div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-start justify-between mb-sm relative z-10">
                <div>
                  <p className="font-label-bold text-[10px] text-on-surface/50 uppercase tracking-[0.15em]">Expiring Soon</p>
                  <p className={`font-headline-xl text-[40px] lg:text-[48px] leading-none mt-xs tracking-tighter ${
                    expiringSoon > 0 ? 'text-yellow-500' : 'text-white'
                  }`}>
                    <AnimatedNumber value={expiringSoon} />
                  </p>
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
          </>
        )}
      </div>

      {/* ─── Revenue + Activity Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm lg:gap-gutter">
        {loading ? (
          <>
            <ChartCardSkeleton />
            <div className="lg:col-span-2">
              <ChartCardSkeleton />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ─── Recent Members Table ─── */}
      <section>
        <div className="flex justify-between items-center mb-sm">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-md text-[18px] text-white uppercase tracking-tight">Recent Members</h3>
            {!loading && <span className="bg-primary-container/10 text-primary-container font-label-bold text-[10px] px-sm py-[2px] uppercase">{recentMembers.length}</span>}
          </div>
          <button
            onClick={() => navigate('/members')}
            className="font-label-bold text-[11px] text-on-surface/50 uppercase hover:text-primary-container transition-colors flex items-center gap-xs group"
          >
            View All
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
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
                  <tr 
                    key={member.id} 
                    onClick={() => navigate(`/members/${member.id}`)}
                    className={`group hover:bg-white/[0.02] cursor-pointer transition-colors ${idx < recentMembers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                  >
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
        )}
      </section>

      {/* ─── SECTION 1: Expiring Soon List ─── */}
      <section>
        <div className="flex items-center gap-sm mb-sm">
          <h3 className="font-headline-md text-[18px] text-white uppercase tracking-tight flex items-center gap-xs">
            <span className="material-symbols-outlined text-yellow-500 text-[20px]">warning</span>
            Expiring Soon
          </h3>
          {!loading && (
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-label-bold text-[10px] px-sm py-[2px] uppercase">
              {expiringMembersList.length}
            </span>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : (
          <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Name</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Phone</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Expiry Date</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiringMembersList.map((m) => {
                  const user = m.users || {};
                  const plan = plans.find(p => p.id === m.plan_id);
                  const daysLeft = getDaysLeft(m.membership_end);
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="group hover:bg-white/[0.02] cursor-pointer transition-colors border-b border-white/[0.03] last:border-none"
                    >
                      <td className="p-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-9 h-9 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-yellow-500/40 transition-colors">
                            <span className="font-headline-md text-[14px] text-yellow-500">{user.name?.charAt(0) || '?'}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-body-md text-[13px] font-bold text-white uppercase truncate">{user.name || 'Unknown'}</p>
                            <p className="font-label-sm text-[10px] text-on-surface/40 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-md font-body-md text-[12px] text-on-surface/50">{user.phone || '-'}</td>
                      <td className="p-md">
                        <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60 group-hover:border-yellow-500/30 group-hover:text-yellow-500 transition-colors">
                          {plan?.name || getPlanName(m)}
                        </span>
                      </td>
                      <td className="p-md font-body-md text-[12px] text-on-surface/40">{formatDate(m.membership_end)}</td>
                      <td className="p-md text-right">
                        <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[10px] uppercase ${
                          daysLeft < 7 
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {expiringMembersList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-lg text-center font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">
                      No memberships expiring soon
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── SECTION 2: Overdue Payments List ─── */}
      <section>
        <div className="flex items-center gap-sm mb-sm">
          <h3 className="font-headline-md text-[18px] text-white uppercase tracking-tight flex items-center gap-xs">
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            Overdue Payments
          </h3>
          {!loading && (
            <span className="bg-error/10 text-error border border-error/20 font-label-bold text-[10px] px-sm py-[2px] uppercase">
              {overduePaymentsList.length}
            </span>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : (
          <div className="bg-surface-container border border-white/[0.06] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member Name</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Amount</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Due Date</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Days Overdue</th>
                  <th className="p-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {overduePaymentsList.map((p) => {
                  const user = p.users || {};
                  const member = members.find(m => m.user_id === p.member_id || m.id === p.member_id);
                  const memberName = user.name || member?.users?.name || 'Unknown';
                  const memberEmail = user.email || member?.users?.email || '';
                  
                  const dueDate = p.due_date || p.period_end;
                  const daysOverdue = getDaysOverdue(dueDate);
                  
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => {
                        if (member) {
                          navigate(`/members/${member.id}`);
                        } else {
                          navigate('/members');
                        }
                      }}
                      className="group hover:bg-white/[0.02] cursor-pointer transition-colors border-b border-white/[0.03] last:border-none"
                    >
                      <td className="p-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-9 h-9 bg-gradient-to-br from-error/20 to-error/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-error/40 transition-colors">
                            <span className="font-headline-md text-[14px] text-error">{memberName.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-body-md text-[13px] font-bold text-white uppercase truncate">{memberName}</p>
                            <p className="font-label-sm text-[10px] text-on-surface/40 truncate">{memberEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-md font-body-md text-[13px] font-bold text-white">₹{parseFloat(p.amount || 0).toLocaleString()}</td>
                      <td className="p-md font-body-md text-[12px] text-on-surface/40">{formatDate(dueDate)}</td>
                      <td className="p-md">
                        <span className="inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[10px] uppercase bg-error/10 text-error border border-error/20">
                          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                        </span>
                      </td>
                      <td className="p-md text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkPaid(p.id, p.amount, memberName);
                          }}
                          disabled={actionLoading}
                          className="bg-primary-container text-on-primary font-label-bold text-[10px] px-sm py-[4px] uppercase hover:brightness-110 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {overduePaymentsList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-lg text-center font-label-bold text-[12px] text-green-500 uppercase tracking-wider py-md">
                      All payments up to date ✓
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
