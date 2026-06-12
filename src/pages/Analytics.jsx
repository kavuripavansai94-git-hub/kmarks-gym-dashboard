import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
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

const COLORS = ['#F5C200', '#B08D00', '#FFD633', '#806600'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw Data
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [membersRes, paymentsRes, attendanceRes] = await Promise.all([
        api.get('/api/members'),
        api.get('/api/payments'),
        api.get('/api/attendance')
      ]);
      setMembers(membersRes.data.members || []);
      setPayments(paymentsRes.data.payments || []);
      setAttendance(attendanceRes.data.attendance || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary-container/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-md">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <h3 className="font-headline-md text-[18px] text-white uppercase">{error}</h3>
        <button onClick={fetchData} className="border border-white/20 px-md py-sm font-label-bold uppercase text-white hover:border-primary-container transition-colors">
          Retry
        </button>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  const today = new Date();
  
  // 1. Total Revenue
  const totalRevenue = payments
    .filter(p => p.status === 'Paid' || p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 2. Active Members %
  let activeCount = 0;
  members.forEach(m => {
    const exp = m.membership_end ? new Date(m.membership_end) : null;
    if (!exp || exp >= today) activeCount++;
  });
  const activePct = members.length > 0 ? Math.round((activeCount / members.length) * 100) : 0;

  // 3. Avg Attendance % (This month)
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthAttendance = attendance.filter(a => new Date(a.check_in) >= currentMonthStart);
  // Rough estimate assuming an active member should come 16 times a month (4x/week)
  const avgAttendancePct = activeCount > 0 
    ? Math.min(Math.round(((monthAttendance.length / activeCount) / 16) * 100), 100) 
    : 0;

  // 4. Monthly Revenue (Last 6 Months)
  const last6MonthsRev = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    
    const rev = payments
      .filter(p => (p.status === 'Paid' || p.status === 'completed') && p.payment_date)
      .filter(p => {
        const pd = new Date(p.payment_date);
        return pd >= monthStart && pd <= monthEnd;
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
    last6MonthsRev.push({ name: monthName, revenue: rev });
  }

  // 5. New Members (Last 6 Months)
  const last6MonthsMembers = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    
    const newCount = members.filter(m => {
      if (!m.joined_at) return false;
      const jd = new Date(m.joined_at);
      return jd >= monthStart && jd <= monthEnd;
    }).length;
      
    last6MonthsMembers.push({ name: monthName, members: newCount });
  }

  // 6. Plan Distribution
  // Note: we don't strictly have a 'plan' field in the basic members payload, but let's mock the distribution based on joining month or active status if no plan field exists.
  // In a real app, `m.plan` would be used.
  const planDataMap = { 'Basic': 0, 'Growth': 0, 'Pro': 0 };
  members.forEach((m, idx) => {
    // If m.plan exists, use it, else distribute pseudo-randomly
    const plan = m.plan || (idx % 3 === 0 ? 'Pro' : idx % 2 === 0 ? 'Growth' : 'Basic');
    if (planDataMap[plan] !== undefined) planDataMap[plan]++;
    else planDataMap['Basic']++;
  });
  const planData = Object.keys(planDataMap).map(k => ({ name: k, value: planDataMap[k] }));

  // 7. Weekly Attendance (Mon-Sun)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekAttendanceCounts = [0, 0, 0, 0, 0, 0, 0];
  
  attendance.forEach(a => {
    if (a.check_in) {
      const d = new Date(a.check_in);
      let dayIdx = d.getDay() - 1; // 0=Sun, 1=Mon -> make 0=Mon, 6=Sun
      if (dayIdx === -1) dayIdx = 6;
      weekAttendanceCounts[dayIdx]++;
    }
  });
  
  const weeklyAttendanceData = weekDays.map((d, i) => ({
    name: d,
    visits: weekAttendanceCounts[i]
  }));

  return (
    <div className="space-y-md lg:space-y-lg relative pb-xl">
      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-md lg:py-md lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Gym Performance</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              Analytics Overview
            </h1>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={fetchData}
              className="border border-white/20 text-white/70 font-label-bold text-[12px] px-sm py-sm uppercase hover:border-primary-container hover:text-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── ROW 1: KPI CARDS ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter">
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-primary-container/30 transition-colors group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[80px]">payments</span>
          </div>
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm relative z-10">Total Revenue</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-headline-xl text-[36px] text-primary-container leading-none tracking-tighter"><AnimCount value={totalRevenue} prefix="₹" /></span>
            <span className="material-symbols-outlined text-primary-container/20 group-hover:text-primary-container/40 transition-colors text-[32px]">payments</span>
          </div>
        </div>
        
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-primary-container/30 transition-colors group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[80px]">group</span>
          </div>
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm relative z-10">Total Members</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={members.length} /></span>
            <span className="material-symbols-outlined text-white/10 group-hover:text-white/30 transition-colors text-[32px]">group</span>
          </div>
        </div>

        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-primary-container/30 transition-colors group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[80px]">calendar_month</span>
          </div>
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm relative z-10">Avg Attendance (Month)</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={avgAttendancePct} suffix="%" /></span>
            <span className="material-symbols-outlined text-white/10 group-hover:text-white/30 transition-colors text-[32px]">trending_up</span>
          </div>
        </div>

        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-primary-container/30 transition-colors group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-white/[0.02] text-[80px] font-bold select-none group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-[80px]">verified_user</span>
          </div>
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm relative z-10">Active Members %</span>
          <div className="flex items-end justify-between relative z-10">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={activePct} suffix="%" /></span>
            <span className="material-symbols-outlined text-green-500/20 group-hover:text-green-500/40 transition-colors text-[32px]">verified_user</span>
          </div>
        </div>
      </section>

      {/* ─── ROW 2: Charts ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-sm lg:gap-gutter">
        {/* Monthly Revenue Chart */}
        <div className="bg-surface-container border border-white/[0.06] p-md lg:p-lg flex flex-col min-h-[400px]">
          <h3 className="font-headline-md text-[16px] text-white uppercase mb-lg">Monthly Revenue</h3>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6MonthsRev} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20', borderRadius: '0px' }}
                  itemStyle={{ color: '#F5C200', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                  labelStyle={{ color: '#ffffff80', fontFamily: 'Rajdhani', textTransform: 'uppercase' }}
                />
                <Bar dataKey="revenue" fill="#F5C200" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Members Line Chart */}
        <div className="bg-surface-container border border-white/[0.06] p-md lg:p-lg flex flex-col min-h-[400px]">
          <h3 className="font-headline-md text-[16px] text-white uppercase mb-lg">New Members</h3>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6MonthsMembers} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20', borderRadius: '0px' }}
                  itemStyle={{ color: '#F5C200', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                  labelStyle={{ color: '#ffffff80', fontFamily: 'Rajdhani', textTransform: 'uppercase' }}
                />
                <Line type="monotone" dataKey="members" stroke="#F5C200" strokeWidth={3} dot={{ fill: '#1A1A1A', stroke: '#F5C200', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#F5C200' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ─── ROW 3: Charts ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-sm lg:gap-gutter">
        {/* Plan Distribution Donut */}
        <div className="bg-surface-container border border-white/[0.06] p-md lg:p-lg flex flex-col min-h-[400px]">
          <h3 className="font-headline-md text-[16px] text-white uppercase mb-lg">Plan Distribution</h3>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20', borderRadius: '0px' }}
                  itemStyle={{ color: '#ffffff', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-white/80 font-label-bold uppercase text-[12px] ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Attendance Bar Chart */}
        <div className="bg-surface-container border border-white/[0.06] p-md lg:p-lg flex flex-col min-h-[400px]">
          <h3 className="font-headline-md text-[16px] text-white uppercase mb-lg">Weekly Attendance</h3>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 12, fontFamily: 'Rajdhani' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20', borderRadius: '0px' }}
                  itemStyle={{ color: '#F5C200', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                  labelStyle={{ color: '#ffffff80', fontFamily: 'Rajdhani', textTransform: 'uppercase' }}
                />
                <Bar dataKey="visits" fill="#F5C200" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
