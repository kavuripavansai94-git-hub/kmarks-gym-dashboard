import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Reusable Animated Counter
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

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [member, setMember] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [progress, setProgress] = useState([]);
  
  const [activeTab, setActiveTab] = useState('workout');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleUpdatePaymentStatus = async (paymentId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      const todayDate = new Date().toISOString().split('T')[0];
      await api.put(`/api/payments/${paymentId}`, {
        status: 'completed',
        paid_date: todayDate
      });
      setActionSuccess('Payment marked as paid.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update payment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch member first, as it's critical
      const memberRes = await api.get(`/api/members/${id}`);
      setMember(memberRes.data.member || null);

      // Fetch other data in parallel, but handle failures individually
      const safeFetch = async (url, setter, dataKey) => {
        try {
          const res = await api.get(url);
          setter(res.data[dataKey] || []);
        } catch (e) {
          console.warn(`Failed to fetch ${url}`, e);
          setter([]);
        }
      };

      await Promise.all([
        safeFetch(`/api/workout-plans?member_id=${id}`, setWorkoutPlans, 'workoutPlans'),
        safeFetch(`/api/diet-plans?member_id=${id}`, setDietPlans, 'dietPlans'),
        safeFetch(`/api/payments?member_id=${id}`, setPayments, 'payments'),
        safeFetch(`/api/attendance?member_id=${id}`, setAttendance, 'attendance'),
        safeFetch(`/api/progress?member_id=${id}`, setProgress, 'progress')
      ]);

    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load member profile data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

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
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Profile...</span>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-md">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <h3 className="font-headline-md text-[18px] text-white uppercase">{error || 'Member not found'}</h3>
        <button onClick={() => navigate('/members')} className="border border-white/20 px-md py-sm font-label-bold uppercase text-white hover:border-primary-container transition-colors">
          Back to Members
        </button>
      </div>
    );
  }

  // --- Computations ---
  const user = member.users || {};
  const trainerName = member.trainers?.users?.name || 'Self-Trained';
  
  // Status & Days
  const today = new Date(); today.setHours(0,0,0,0);
  const expDate = member.membership_end ? new Date(member.membership_end) : null;
  let status = 'Active';
  if (expDate && expDate < today) status = 'Expired';
  else if (expDate && expDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) status = 'Expiring Soon';

  const daysLeft = expDate ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)) : 0;
  
  // Total Paid
  const totalPaid = payments.filter(p => p.status === 'Paid' || p.status === 'completed').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  
  // Attendance this month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthAttendance = attendance.filter(a => new Date(a.check_in) >= currentMonthStart);
  // Rough estimate of % assuming they should come 20 days a month
  const attendancePct = Math.min(Math.round((monthAttendance.length / 20) * 100), 100);

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

      {/* ─── Back Button ─── */}
      <button 
        onClick={() => navigate('/members')}
        className="flex items-center gap-xs font-label-bold text-[10px] uppercase text-on-surface/50 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Directory
      </button>

      {/* ─── SECTION 1: Header Card ─── */}
      <section className="relative overflow-hidden border border-white/[0.06] bg-surface-container p-md lg:p-lg flex flex-col md:flex-row gap-lg items-start md:items-center justify-between group hover:border-primary-container/30 transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-container shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-lg relative z-10">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-surface-container-high border-2 border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
            {/* Avatar placeholder */}
            <span className="font-headline-lg text-[48px] text-primary-container uppercase">{user.name?.charAt(0) || 'M'}</span>
          </div>

          <div className="space-y-sm">
            <div>
              <div className="flex items-center gap-sm mb-xs">
                <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                  status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                  status === 'Expired' ? 'bg-error/10 text-error border border-error/20' : 
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }`}>
                  <span className={`w-[5px] h-[5px] rounded-full ${
                    status === 'Active' ? 'bg-green-500' : status === 'Expired' ? 'bg-error' : 'bg-yellow-500'
                  }`}></span>
                  {status}
                </span>
                {/* Plan Badge (Basic/Growth/Pro mapped from DB or static if none) */}
                <span className="font-label-bold text-[9px] uppercase bg-white/5 border border-white/10 px-sm py-[3px] text-on-surface">
                  Premium Plan
                </span>
              </div>
              <h1 className="font-headline-lg text-[32px] text-white uppercase tracking-tight leading-none">{user.name}</h1>
            </div>

            <div className="flex flex-col gap-1 font-body-md text-[13px] text-on-surface/60">
              <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">phone</span> {user.phone || '-'}</span>
              <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">mail</span> {user.email || '-'}</span>
              <span className="flex items-center gap-xs text-primary-container/80 mt-1"><span className="material-symbols-outlined text-[14px]">fitness_center</span> Assigned Trainer: {trainerName}</span>
            </div>
            
            <div className="flex gap-md font-label-bold text-[10px] uppercase text-on-surface/40 mt-sm">
              <span>Joined: <span className="text-white">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}</span></span>
              <span>Expires: <span className={status === 'Expired' ? 'text-error' : 'text-white'}>{member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-sm w-full md:w-auto relative z-10 shrink-0 mt-md md:mt-0">
          <button className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none">
            Renew Membership
          </button>
          <button className="border border-white/20 text-white font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white/5 transition-colors">
            Edit Member
          </button>
        </div>
      </section>

      {/* ─── SECTION 2: 3 Stat Cards Row ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-sm lg:gap-gutter">
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-white/20 transition-colors">
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Attendance % (Month)</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={attendancePct} suffix="%" /></span>
            <span className="material-symbols-outlined text-white/10 text-[32px]">calendar_today</span>
          </div>
        </div>
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-white/20 transition-colors">
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Days Until Expiry</span>
          <div className="flex items-end justify-between">
            <span className={`font-headline-xl text-[36px] leading-none tracking-tighter ${status === 'Expired' ? 'text-error' : 'text-white'}`}>
              {status === 'Expired' ? '0' : <AnimCount value={Math.max(0, daysLeft)} />}
            </span>
            <span className="material-symbols-outlined text-white/10 text-[32px]">schedule</span>
          </div>
        </div>
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-white/20 transition-colors">
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Total Paid</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-xl text-[36px] text-primary-container leading-none tracking-tighter"><AnimCount value={totalPaid} prefix="₹" /></span>
            <span className="material-symbols-outlined text-primary-container/10 text-[32px]">payments</span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Tabs ─── */}
      <section className="bg-surface-container border border-white/[0.06]">
        <div className="flex border-b border-white/[0.06] overflow-x-auto hide-scrollbar">
          {['workout', 'diet', 'progress', 'payments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-lg py-md font-label-bold text-[11px] uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab ? 'text-primary-container border-primary-container bg-primary-container/5' : 'text-on-surface/40 border-transparent hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="p-md lg:p-lg min-h-[300px]">
          {/* TAB 1: Workout Plan */}
          {activeTab === 'workout' && (
            <div>
              {workoutPlans.length > 0 ? (
                <div className="space-y-md">
                  <h3 className="font-headline-md text-[18px] text-white uppercase mb-sm">Assigned Workout Plan</h3>
                  {workoutPlans.map(plan => (
                    <div key={plan.id} className="border border-white/10 p-md">
                      <p className="font-label-bold text-primary-container text-[12px] uppercase mb-sm">{plan.name || `Plan #${plan.id}`}</p>
                      <p className="font-body-md text-[13px] text-on-surface/60">{plan.description}</p>
                      {/* Normally would map workoutDays here if the API included them nested */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-xl text-center">
                  <span className="material-symbols-outlined text-on-surface/15 text-[48px] mb-sm">fitness_center</span>
                  <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">No workout plan assigned yet</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Diet Plan */}
          {activeTab === 'diet' && (
            <div>
              {dietPlans.length > 0 ? (
                <div className="space-y-md">
                  <h3 className="font-headline-md text-[18px] text-white uppercase mb-sm">Assigned Diet Plan</h3>
                  {dietPlans.map(plan => (
                    <div key={plan.id} className="border border-white/10 p-md">
                      <p className="font-label-bold text-primary-container text-[12px] uppercase mb-sm">{plan.name || `Diet #${plan.id}`}</p>
                      <p className="font-body-md text-[13px] text-on-surface/60 mb-sm">{plan.description}</p>
                      <p className="font-label-bold text-[10px] text-on-surface/40 uppercase">Total Calories: {plan.total_calories || '-'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-xl text-center">
                  <span className="material-symbols-outlined text-on-surface/15 text-[48px] mb-sm">restaurant</span>
                  <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">No diet plan assigned yet</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Progress */}
          {activeTab === 'progress' && (
            <div>
              <div className="flex justify-between items-end mb-md">
                <h3 className="font-headline-md text-[18px] text-white uppercase">Progress Tracking</h3>
                <button className="bg-surface-container-highest border border-white/10 px-sm py-sm font-label-bold text-[10px] text-white uppercase hover:border-primary-container transition-colors">
                  + Log Entry
                </button>
              </div>
              
              {progress.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-surface-container-low">
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Date</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Weight</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Body Fat %</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.map((log) => (
                        <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-sm px-md font-body-md text-[13px] text-white">{new Date(log.date || log.created_at).toLocaleDateString()}</td>
                          <td className="py-sm px-md font-label-bold text-[12px] text-primary-container">{log.weight || '-'} kg</td>
                          <td className="py-sm px-md font-body-md text-[13px] text-on-surface/60">{log.body_fat_percentage ? `${log.body_fat_percentage}%` : '-'}</td>
                          <td className="py-sm px-md font-body-md text-[12px] text-on-surface/40 max-w-xs truncate">{log.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-xl text-center border border-white/[0.03]">
                  <span className="material-symbols-outlined text-on-surface/15 text-[48px] mb-sm">trending_up</span>
                  <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">No progress logs recorded</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Payments */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-end mb-md">
                <h3 className="font-headline-md text-[18px] text-white uppercase">Payment History</h3>
                <button className="bg-surface-container-highest border border-white/10 px-sm py-sm font-label-bold text-[10px] text-white uppercase hover:border-primary-container transition-colors">
                  + Record Payment
                </button>
              </div>

              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-surface-container-low">
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Date</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Amount</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Method</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Status</th>
                        <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const statusStr = (p.status || '').toLowerCase();
                        const isPending = statusStr === 'pending' || statusStr === 'overdue';
                        return (
                          <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="py-sm px-md font-body-md text-[13px] text-white">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                            <td className="py-sm px-md font-label-bold text-[12px] text-primary-container">₹{p.amount}</td>
                            <td className="py-sm px-md font-body-md text-[13px] text-on-surface/60 capitalize">{p.payment_method || '-'}</td>
                            <td className="py-sm px-md">
                              <span className={`inline-flex items-center gap-[4px] px-sm py-[3px] font-label-bold text-[9px] uppercase ${
                                statusStr === 'completed' || statusStr === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                statusStr === 'failed' ? 'bg-error/10 text-error border border-error/20' : 
                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                <span className={`w-[5px] h-[5px] rounded-full ${
                                  statusStr === 'completed' || statusStr === 'paid' ? 'bg-green-500' : statusStr === 'failed' ? 'bg-error' : 'bg-yellow-500'
                                }`}></span>
                                {statusStr === 'completed' || statusStr === 'paid' ? 'PAID' : statusStr}
                              </span>
                            </td>
                            <td className="py-sm px-md text-right">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id)}
                                  disabled={actionLoading}
                                  className="font-label-bold text-[10px] text-white border-b border-white/30 hover:text-green-500 hover:border-green-500 pb-[2px] transition-colors uppercase disabled:opacity-30"
                                >
                                  Mark as Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-xl text-center border border-white/[0.03]">
                  <span className="material-symbols-outlined text-on-surface/15 text-[48px] mb-sm">receipt_long</span>
                  <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">No payment history found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
