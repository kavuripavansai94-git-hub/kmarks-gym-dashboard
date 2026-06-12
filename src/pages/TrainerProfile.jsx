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

export default function TrainerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [trainer, setTrainer] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trainer by ID
      const trainerRes = await api.get(`/api/trainers/${id}`);
      setTrainer(trainerRes.data.trainer || null);

      // Fetch all members and plans to resolve associations in parallel
      const fetchPlans = async () => {
        try {
          const res = await api.get('/api/plans');
          return res.data.plans || [];
        } catch (err) {
          console.warn('Could not fetch plans:', err);
          return [];
        }
      };

      const [membersRes, plansData] = await Promise.all([
        api.get('/api/members'),
        fetchPlans()
      ]);

      setMembers(membersRes.data.members || []);
      setPlans(plansData || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load trainer profile data.');
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
        <span className="font-label-bold text-label-md text-primary-container uppercase tracking-[0.25em] animate-pulse">Loading Trainer Profile...</span>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-md">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <h3 className="font-headline-md text-[18px] text-white uppercase">{error || 'Trainer not found'}</h3>
        <button onClick={() => navigate('/trainers')} className="border border-white/20 px-md py-sm font-label-bold uppercase text-white hover:border-primary-container transition-colors">
          Back to Trainers
        </button>
      </div>
    );
  }

  const user = trainer.users || {};
  const assignedMembers = members.filter(m => m.assigned_trainer_id === trainer.user_id);

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'No Plan';
  };

  const getMemberStatus = (member) => {
    if (!member.membership_end) return 'Active';
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(member.membership_end);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    if (expiry < today) return 'Expired';
    if (expiry <= soon) return 'Expiring Soon';
    return 'Active';
  };

  return (
    <div className="space-y-md lg:space-y-lg relative">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/trainers')}
        className="flex items-center gap-xs font-label-bold text-[10px] uppercase text-on-surface/50 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Trainers Directory
      </button>

      {/* Header Card */}
      <section className="relative overflow-hidden border border-white/[0.06] bg-surface-container p-md lg:p-lg flex flex-col md:flex-row gap-lg items-start md:items-center justify-between group hover:border-primary-container/30 transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-container shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-lg relative z-10">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-surface-container-high border-2 border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
            <span className="font-headline-lg text-[48px] text-primary-container uppercase">{user.name?.charAt(0) || 'T'}</span>
          </div>

          <div className="space-y-sm">
            <div>
              <div className="flex items-center gap-sm mb-xs">
                <span className="font-label-bold text-[9px] uppercase bg-primary-container/10 border border-primary-container/20 px-sm py-[3px] text-primary-container">
                  {trainer.specialization || 'General Trainer'}
                </span>
                <span className="font-label-bold text-[9px] uppercase bg-white/5 border border-white/10 px-sm py-[3px] text-on-surface">
                  {trainer.experience_years || 0} Years Experience
                </span>
              </div>
              <h1 className="font-headline-lg text-[32px] text-white uppercase tracking-tight leading-none">{user.name}</h1>
            </div>

            <div className="flex flex-col gap-1 font-body-md text-[13px] text-on-surface/60">
              <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">phone</span> {user.phone || '-'}</span>
              <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">mail</span> {user.email || '-'}</span>
            </div>
            
            <div className="flex gap-md font-label-bold text-[10px] uppercase text-on-surface/40 mt-sm">
              <span>Joined: <span className="text-white">{formatDate(trainer.created_at)}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-sm lg:gap-gutter">
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-white/20 transition-colors">
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Assigned Members</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={assignedMembers.length} /></span>
            <span className="material-symbols-outlined text-white/10 text-[32px]">group</span>
          </div>
        </div>
        <div className="bg-surface-container border border-white/[0.06] p-md flex flex-col justify-between hover:border-white/20 transition-colors">
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Max Capacity</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={trainer.max_clients || 20} /></span>
            <span className="material-symbols-outlined text-white/10 text-[32px]">event_seat</span>
          </div>
        </div>
      </section>

      {/* Assigned Members Section */}
      <section className="bg-surface-container border border-white/[0.06] p-md lg:p-lg space-y-md">
        <h3 className="font-headline-md text-[18px] text-white uppercase tracking-tight">Assigned Members ({assignedMembers.length})</h3>
        
        {assignedMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-surface-container-low">
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Member</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan</th>
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedMembers.map((m) => {
                  const u = m.users || {};
                  const status = getMemberStatus(m);
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-sm px-md font-body-md text-[13px] text-white uppercase font-bold">{u.name}</td>
                      <td className="py-sm px-md">
                        <span className="border border-white/10 px-sm py-[3px] font-label-bold text-[9px] uppercase text-on-surface/60">
                          {getPlanName(m.plan_id)}
                        </span>
                      </td>
                      <td className="py-sm px-md text-center">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <span className="material-symbols-outlined text-on-surface/15 text-[48px] mb-sm">group</span>
            <p className="font-label-bold text-[11px] text-on-surface/30 uppercase tracking-wider">No members assigned to this trainer yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
