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
        Back to Trainers
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
              </div>
              <h1 className="font-headline-lg text-[32px] text-white uppercase tracking-tight leading-none">{user.name}</h1>
            </div>

            <div className="flex flex-col gap-1 font-body-md text-[13px] text-on-surface/60">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">phone</span> {user.phone || '-'}
                {user.phone && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      let p = user.phone.replace(/[\s+]/g, '');
                      if(p.startsWith('91')) p = p.substring(2);
                      else if(p.startsWith('0')) p = p.substring(1);
                      window.open(`https://wa.me/91${p}`, '_blank');
                    }}
                    className="w-5 h-5 ml-1 inline-flex items-center justify-center text-on-surface/50 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all rounded-full"
                    title="Message on WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[12px] h-[12px]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </button>
                )}
              </div>
              <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[14px]">mail</span> {user.email || '-'}</span>
            </div>
            
            <div className="flex gap-md font-label-bold text-[10px] uppercase text-on-surface/40 mt-sm">
              <span>Joined: <span className="text-white">{formatDate(trainer.created_at)}</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-sm w-full md:w-auto relative z-10 shrink-0 mt-md md:mt-0">
          <button 
            onClick={() => navigate(`/trainers?edit=${trainer.id}`)}
            className="border border-white/20 text-white font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white/5 transition-colors"
          >
            Edit Trainer
          </button>
          <button 
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this trainer?')) {
                try {
                  await api.delete(`/api/trainers/${trainer.id}`);
                  navigate('/trainers');
                } catch(e) {
                  window.alert('Failed to delete trainer');
                }
              }
            }}
            className="border border-error/50 text-error font-label-bold text-[11px] px-lg py-md uppercase hover:bg-error/10 hover:border-error transition-colors"
          >
            Delete Trainer
          </button>
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
          <span className="font-label-bold text-on-surface/40 uppercase text-[10px] tracking-wider mb-sm">Total Members</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-xl text-[36px] text-white leading-none tracking-tighter"><AnimCount value={members.length} /></span>
            <span className="material-symbols-outlined text-white/10 text-[32px]">groups</span>
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
                  <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Expiry Date</th>
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
                      <td className="py-sm px-md font-body-md text-[13px] text-on-surface/50">
                        {formatDate(m.membership_end)}
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
