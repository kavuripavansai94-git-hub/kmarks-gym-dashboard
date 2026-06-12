import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Helper to format currency
const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form inputs
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState('Month');
  const [description, setDescription] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState([]);

  // Toast notifications helper
  const notify = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Helper to parse description and extract optional features JSON
  const parsePlanDescription = (plan) => {
    let descText = plan.description || '';
    let planFeatures = [];

    if (descText.startsWith('{') && descText.endsWith('}')) {
      try {
        const parsed = JSON.parse(descText);
        descText = parsed.description || '';
        planFeatures = parsed.features || [];
      } catch (e) {
        // Fallback if JSON parsing fails
        descText = plan.description;
      }
    }

    // Default features if none specified to look premium
    if (planFeatures.length === 0) {
      const lowerName = plan.name.toLowerCase();
      if (lowerName.includes('premium') || lowerName.includes('pro') || plan.price >= 3000) {
        planFeatures = ['All Cardio & Strength Gym Access', 'Personal Locker Access', 'Free Personal Trainer consultation', 'Sauna & Steam Bath', '2 Guest Passes / Month'];
      } else if (lowerName.includes('growth') || lowerName.includes('quarterly') || plan.price >= 1500) {
        planFeatures = ['All Cardio & Strength Gym Access', 'Personal Locker Access', 'Sauna Access (Weekends only)', '1 Gym T-shirt'];
      } else {
        planFeatures = ['All Cardio & Strength Gym Access', 'General locker usage', 'Free hydration station access'];
      }
    }

    return { description: descText, features: planFeatures };
  };

  // Serializes description and features into single field if database doesn't support features list
  const serializePlanDescription = (descText, planFeatures) => {
    return JSON.stringify({
      description: descText,
      features: planFeatures
    });
  };

  // Fetch plans & members to calculate counts
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch plans and members in parallel
      const [plansRes, membersRes] = await Promise.all([
        api.get('/api/plans').catch((err) => {
          console.warn('Could not fetch plans from API, using fallback data:', err);
          return { data: { plans: null } };
        }),
        api.get('/api/members').catch((err) => {
          console.warn('Could not fetch members from API:', err);
          return { data: { members: [] } };
        })
      ]);

      let fetchedPlans = plansRes.data?.plans;
      const fetchedMembers = membersRes.data?.members || [];
      setMembers(fetchedMembers);

      // If API did not return plans or returned empty, load fallback + localStorage
      if (!fetchedPlans || fetchedPlans.length === 0) {
        const defaultPlans = [
          { id: '1', name: 'Basic Monthly', price: 1000, duration: '1 Month', description: 'Standard gym access plan' },
          { id: '2', name: 'Growth Quarterly', price: 2500, duration: '3 Months', description: 'Most popular plan for continuous progress' },
          { id: '3', name: 'Pro Yearly', price: 8500, duration: '12 Months', description: 'Elite membership for dedicated members' }
        ];

        // Merge with local storage custom plans
        const localPlansStr = localStorage.getItem('kmarks_local_plans');
        if (localPlansStr) {
          try {
            const localPlans = JSON.parse(localPlansStr);
            fetchedPlans = [...defaultPlans, ...localPlans];
          } catch (e) {
            fetchedPlans = defaultPlans;
          }
        } else {
          fetchedPlans = defaultPlans;
        }
      } else {
        // Also merge with any local-only plans if exist
        const localPlansStr = localStorage.getItem('kmarks_local_plans');
        if (localPlansStr) {
          try {
            const localPlans = JSON.parse(localPlansStr);
            // filter out any local plans that conflict with API plan IDs
            const apiIds = new Set(fetchedPlans.map(p => String(p.id)));
            const uniqueLocal = localPlans.filter(p => !apiIds.has(String(p.id)));
            fetchedPlans = [...fetchedPlans, ...uniqueLocal];
          } catch (e) {}
        }
      }

      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load plans data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute stats
  const computeMemberStatus = (end) => {
    if (!end) return 'Active';
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(end);
    return exp >= today ? 'Active' : 'Expired';
  };

  const getPlanStats = () => {
    const activeSubscribers = members.filter(m => computeMemberStatus(m.membership_end) === 'Active');
    
    // Count active members per plan ID
    const planCounts = {};
    activeSubscribers.forEach(m => {
      if (m.plan_id) {
        planCounts[m.plan_id] = (planCounts[m.plan_id] || 0) + 1;
      }
    });

    // Find most popular plan
    let maxCount = -1;
    let popularPlanName = 'None';
    plans.forEach(p => {
      const count = planCounts[p.id] || 0;
      if (count > maxCount && count > 0) {
        maxCount = count;
        popularPlanName = p.name;
      }
    });

    const totalPackages = plans.length;
    const avgPrice = plans.length ? plans.reduce((sum, p) => sum + Number(p.price || 0), 0) / plans.length : 0;
    const totalSubscribed = activeSubscribers.filter(m => m.plan_id).length;

    return {
      totalPackages,
      popularPlanName,
      totalSubscribed,
      avgPrice,
      planCounts
    };
  };

  const stats = getPlanStats();

  // Handle adding feature
  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  // Handle removing feature
  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Open add modal
  const openAddModalHandler = () => {
    setName('');
    setPrice('');
    setDurationValue('1');
    setDurationUnit('Month');
    setDescription('');
    setFeatures(['All Cardio & Strength Gym Access', 'General locker usage', 'Free hydration station access']);
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModalHandler = (plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    
    // Parse duration (e.g., "3 Months" -> value 3, unit Month)
    const durParts = plan.duration ? plan.duration.split(' ') : ['1', 'Month'];
    setDurationValue(durParts[0] || '1');
    setDurationUnit(durParts[1] ? durParts[1].replace(/s$/, '') : 'Month'); // remove trailing 's'

    const parsed = parsePlanDescription(plan);
    setDescription(parsed.description);
    setFeatures(parsed.features);
    setShowEditModal(true);
  };

  // Save Add Plan
  const handleAddPlanSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !durationValue) return;

    setActionLoading(true);
    const durationStr = `${durationValue} ${durationUnit}${Number(durationValue) > 1 ? 's' : ''}`;
    const descSerialized = serializePlanDescription(description, features);

    const planPayload = {
      name,
      price: Number(price),
      duration: durationStr,
      description: descSerialized
    };

    try {
      // Attempt API request
      const res = await api.post('/api/plans', planPayload);
      notify('New package created successfully!');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.warn('API POST failed, falling back to local storage:', err);
      // Fallback: Save locally
      const localPlansStr = localStorage.getItem('kmarks_local_plans');
      let localPlans = [];
      if (localPlansStr) {
        try { localPlans = JSON.parse(localPlansStr); } catch (e) {}
      }

      const newLocalPlan = {
        id: `local_${Date.now()}`,
        name: planPayload.name,
        price: planPayload.price,
        duration: planPayload.duration,
        description: planPayload.description
      };

      localPlans.push(newLocalPlan);
      localStorage.setItem('kmarks_local_plans', JSON.stringify(localPlans));
      
      notify('Package created (saved locally on this device)');
      setShowAddModal(false);
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  // Save Edit Plan
  const handleEditPlanSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !durationValue || !editingPlan) return;

    setActionLoading(true);
    const durationStr = `${durationValue} ${durationUnit}${Number(durationValue) > 1 ? 's' : ''}`;
    const descSerialized = serializePlanDescription(description, features);

    const planPayload = {
      name,
      price: Number(price),
      duration: durationStr,
      description: descSerialized
    };

    try {
      if (String(editingPlan.id).startsWith('local_')) {
        throw new Error('Local plan edit skips API');
      }
      // Attempt API request
      await api.put(`/api/plans/${editingPlan.id}`, planPayload);
      notify('Package updated successfully!');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.warn('API PUT failed or skipped for local plan, falling back to local storage edit:', err);
      // Fallback: Edit locally
      const localPlansStr = localStorage.getItem('kmarks_local_plans');
      let localPlans = [];
      if (localPlansStr) {
        try { localPlans = JSON.parse(localPlansStr); } catch (e) {}
      }

      // Check if editing a local plan or editing an API plan offline
      const existsInLocal = localPlans.some(p => p.id === editingPlan.id);
      if (existsInLocal) {
        localPlans = localPlans.map(p => p.id === editingPlan.id ? { ...p, ...planPayload } : p);
      } else {
        // Saving API plan copy locally
        localPlans.push({
          id: editingPlan.id,
          ...planPayload
        });
      }

      localStorage.setItem('kmarks_local_plans', JSON.stringify(localPlans));
      notify('Package updated (saved locally on this device)');
      setShowEditModal(false);
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package? Any members currently assigned to it will retain their plan ID but the package description will be removed.')) {
      return;
    }

    setActionLoading(true);
    try {
      if (String(id).startsWith('local_')) {
        throw new Error('Local plan delete skips API');
      }
      // Attempt API request
      await api.delete(`/api/plans/${id}`);
      notify('Package deleted successfully!');
      fetchData();
    } catch (err) {
      console.warn('API DELETE failed or skipped for local plan, falling back to local storage delete:', err);
      
      // Delete from local storage list
      const localPlansStr = localStorage.getItem('kmarks_local_plans');
      if (localPlansStr) {
        try {
          let localPlans = JSON.parse(localPlansStr);
          localPlans = localPlans.filter(p => p.id !== id);
          localStorage.setItem('kmarks_local_plans', JSON.stringify(localPlans));
        } catch (e) {}
      }

      notify('Package deleted (updated locally)');
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-md lg:space-y-lg relative pb-xl font-body-md text-on-surface">
      {/* ─── Notification Toasts ─── */}
      <div className="fixed top-lg right-lg z-50 flex flex-col gap-sm">
        {error && (
          <div className="bg-error border border-error/30 text-white px-md py-sm font-label-bold text-[11px] uppercase flex items-center gap-sm shadow-lg animate-[slideDown_0.3s_ease]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary-container text-black border border-primary-container/30 px-md py-sm font-label-bold text-[11px] uppercase flex items-center gap-sm shadow-lg animate-[slideDown_0.3s_ease]">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {success}
          </div>
        )}
      </div>

      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-md lg:py-md lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Membership</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              Plans & Packages
            </h1>
          </div>
          <button
            onClick={openAddModalHandler}
            disabled={loading}
            className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Package
          </button>
        </div>
      </section>

      {/* ─── KPI Stats Section ─── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
        {/* KPI 1 */}
        <div className="bg-surface-container border border-white/[0.06] p-md relative overflow-hidden group">
          <div className="absolute right-1 bottom-1 select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none z-0" style={{ opacity: 0.08 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', lineHeight: '1' }}>card_membership</span>
          </div>
          <div className="relative z-10">
            <p className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider mb-sm">Total Packages</p>
            <div className="flex items-baseline gap-xs">
              <h3 className="font-headline-lg text-[32px] text-white leading-none font-bold">
                {loading ? '...' : stats.totalPackages}
              </h3>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container border border-white/[0.06] p-md relative overflow-hidden group">
          <div className="absolute right-1 bottom-1 select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none z-0" style={{ opacity: 0.08 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', lineHeight: '1' }}>trending_up</span>
          </div>
          <div className="relative z-10">
            <p className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider mb-sm">Most Popular</p>
            <div className="flex items-baseline gap-xs">
              <h3 className="font-headline-md text-[18px] lg:text-[20px] text-primary-container leading-none font-bold uppercase truncate max-w-full">
                {loading ? '...' : stats.popularPlanName}
              </h3>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container border border-white/[0.06] p-md relative overflow-hidden group">
          <div className="absolute right-1 bottom-1 select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none z-0" style={{ opacity: 0.08 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', lineHeight: '1' }}>group</span>
          </div>
          <div className="relative z-10">
            <p className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider mb-sm">Subscribed Members</p>
            <div className="flex items-baseline gap-xs">
              <h3 className="font-headline-lg text-[32px] text-white leading-none font-bold">
                {loading ? '...' : stats.totalSubscribed}
              </h3>
              <span className="text-[11px] text-on-surface/30 uppercase font-label-bold ml-xs">Active</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container border border-white/[0.06] p-md relative overflow-hidden group">
          <div className="absolute right-1 bottom-1 select-none group-hover:scale-110 transition-transform duration-500 pointer-events-none z-0" style={{ opacity: 0.08 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', lineHeight: '1' }}>payments</span>
          </div>
          <div className="relative z-10">
            <p className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider mb-sm">Avg Plan Price</p>
            <div className="flex items-baseline gap-xs">
              <h3 className="font-headline-lg text-[28px] text-white leading-none font-bold">
                {loading ? '...' : formatINR(stats.avgPrice)}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Packages Grid Section ─── */}
      {loading ? (
        <div className="bg-surface-container border border-white/[0.06] p-xl text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin mb-md"></div>
          <p className="font-label-bold text-[11px] uppercase text-on-surface/40">Loading plans and packages...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-surface-container border border-white/[0.06] p-xl text-center space-y-md">
          <span className="material-symbols-outlined text-on-surface/20 text-[48px]">card_membership</span>
          <div>
            <h3 className="font-headline-md text-white uppercase text-[16px]">No Packages Configured</h3>
            <p className="font-body-md text-on-surface/40 text-[13px] mt-xs">Get started by creating your first gym membership plan.</p>
          </div>
          <button
            onClick={openAddModalHandler}
            className="bg-primary-container text-black font-label-bold text-[11px] px-md py-sm uppercase hover:bg-white transition-colors"
          >
            Create Plan
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {plans.map((plan) => {
            const parsed = parsePlanDescription(plan);
            const activeCount = stats.planCounts[plan.id] || 0;
            const isLocal = String(plan.id).startsWith('local_');

            return (
              <div 
                key={plan.id}
                className="bg-surface-container border border-white/[0.06] hover:border-primary-container/30 transition-all duration-300 flex flex-col justify-between relative group"
              >
                {/* Visual Accent Top Line */}
                <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-primary-container/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="p-md lg:p-lg space-y-md">
                  {/* Top Meta info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-white/5 border border-white/10 text-on-surface/70 px-sm py-[2px] font-label-bold text-[9px] uppercase tracking-wider">
                        {plan.duration || '1 Month'}
                      </span>
                      {isLocal && (
                        <span className="ml-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-sm py-[2px] font-label-bold text-[9px] uppercase tracking-wider" title="Stored locally in this browser">
                          Local
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-xs opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModalHandler(plan)}
                        className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-primary-container hover:text-black transition-colors rounded"
                        title="Edit Plan"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-error hover:text-white transition-colors rounded"
                        title="Delete Plan"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="font-headline-md text-[20px] text-white uppercase font-bold tracking-tight mb-xs truncate">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-xs">
                      <span className="font-headline-lg text-[26px] text-primary-container font-black leading-none">
                        {formatINR(plan.price)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {parsed.description && (
                    <p className="font-body-md text-[12px] text-on-surface/50 leading-relaxed line-clamp-2">
                      {parsed.description}
                    </p>
                  )}

                  {/* Divider */}
                  <div className="border-t border-white/[0.06]"></div>

                  {/* Features list */}
                  <div className="space-y-xs pt-xs">
                    <p className="font-label-bold text-[9px] uppercase text-on-surface/30 tracking-wider">Inclusions</p>
                    <ul className="space-y-[6px]">
                      {parsed.features.slice(0, 4).map((feat, i) => (
                        <li key={i} className="flex items-start gap-xs text-[11px] text-on-surface/75">
                          <span className="material-symbols-outlined text-primary-container text-[14px] shrink-0 mt-[1px]">check_circle</span>
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                      {parsed.features.length > 4 && (
                        <li className="text-[10px] text-on-surface/40 uppercase font-label-bold pl-[20px]">
                          + {parsed.features.length - 4} more inclusions
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Footer count */}
                <div className="bg-surface-container-low border-t border-white/[0.03] py-sm px-md flex items-center justify-between text-[11px]">
                  <span className="font-label-bold uppercase text-on-surface/40">Active Subscribers</span>
                  <span className={`font-label-bold px-sm py-[1px] rounded-full uppercase ${activeCount > 0 ? 'bg-primary-container/10 text-primary-container' : 'bg-white/5 text-on-surface/30'}`}>
                    {activeCount} {activeCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ─── ADD PLAN MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md animate-[fadeIn_0.2s_ease]">
          <div className="bg-surface-container border border-white/[0.08] w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary-container"></div>
            
            {/* Modal Header */}
            <div className="p-md border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-xs text-primary-container">
                <span className="material-symbols-outlined">add_box</span>
                <h3 className="font-headline-md text-[16px] text-white uppercase font-bold">New Membership Package</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center text-on-surface/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPlanSubmit} className="flex-grow overflow-y-auto p-md space-y-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {/* Plan Name */}
                <div className="flex flex-col gap-[6px] sm:col-span-2">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan Name *</label>
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pro Annual Premium"
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Price (₹) *</label>
                  <input
                    type="number" required min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="8000"
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md"
                  />
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Duration *</label>
                  <div className="flex gap-xs">
                    <input
                      type="number" required min="1" value={durationValue} onChange={e => setDurationValue(e.target.value)}
                      className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md w-16 text-center"
                    />
                    <select
                      value={durationUnit} onChange={e => setDurationUnit(e.target.value)}
                      className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md flex-grow"
                    >
                      <option value="Month">Month(s)</option>
                      <option value="Year">Year(s)</option>
                      <option value="Week">Week(s)</option>
                      <option value="Day">Day(s)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-[6px]">
                <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} rows="2" placeholder="Describe package availability, target users, or schedules..."
                  className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md resize-none"
                />
              </div>

              {/* Inclusions / Features List Builder */}
              <div className="space-y-sm border-t border-white/[0.06] pt-sm">
                <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Package Inclusions / Features</label>
                
                {/* Feature List */}
                <div className="space-y-xs max-h-32 overflow-y-auto pr-xs">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.03] px-sm py-[4px] border border-white/5 text-[12px]">
                      <div className="flex items-center gap-xs text-on-surface/80">
                        <span className="material-symbols-outlined text-primary-container text-[14px]">check_circle</span>
                        <span>{feat}</span>
                      </div>
                      <button
                        type="button" onClick={() => handleRemoveFeature(idx)}
                        className="text-on-surface/30 hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {features.length === 0 && (
                    <p className="text-[11px] text-on-surface/30 italic uppercase">No package features added yet</p>
                  )}
                </div>

                {/* Add Feature Input */}
                <div className="flex gap-xs">
                  <input
                    type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g. Free Cardio Section"
                    className="bg-surface-container-lowest border border-white/10 px-sm py-[6px] text-white text-[12px] focus:border-primary-container/50 outline-none transition-all font-body-md flex-grow"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                  />
                  <button
                    type="button" onClick={handleAddFeature}
                    className="border border-primary-container/50 text-primary-container px-md text-[11px] font-label-bold uppercase hover:bg-primary-container/10 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/[0.08] pt-md flex items-center justify-end gap-sm">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="border border-white/20 text-white font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PLAN MODAL ─── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md animate-[fadeIn_0.2s_ease]">
          <div className="bg-surface-container border border-white/[0.08] w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary-container"></div>
            
            {/* Modal Header */}
            <div className="p-md border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-xs text-primary-container">
                <span className="material-symbols-outlined">edit</span>
                <h3 className="font-headline-md text-[16px] text-white uppercase font-bold">Edit Membership Package</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center text-on-surface/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditPlanSubmit} className="flex-grow overflow-y-auto p-md space-y-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {/* Plan Name */}
                <div className="flex flex-col gap-[6px] sm:col-span-2">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan Name *</label>
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pro Annual Premium"
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Price (₹) *</label>
                  <input
                    type="number" required min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="8000"
                    className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md"
                  />
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Duration *</label>
                  <div className="flex gap-xs">
                    <input
                      type="number" required min="1" value={durationValue} onChange={e => setDurationValue(e.target.value)}
                      className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md w-16 text-center"
                    />
                    <select
                      value={durationUnit} onChange={e => setDurationUnit(e.target.value)}
                      className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md flex-grow"
                    >
                      <option value="Month">Month(s)</option>
                      <option value="Year">Year(s)</option>
                      <option value="Week">Week(s)</option>
                      <option value="Day">Day(s)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-[6px]">
                <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} rows="2" placeholder="Describe package availability, target users, or schedules..."
                  className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 outline-none transition-all font-body-md resize-none"
                />
              </div>

              {/* Inclusions / Features List Builder */}
              <div className="space-y-sm border-t border-white/[0.06] pt-sm">
                <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Package Inclusions / Features</label>
                
                {/* Feature List */}
                <div className="space-y-xs max-h-32 overflow-y-auto pr-xs">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.03] px-sm py-[4px] border border-white/5 text-[12px]">
                      <div className="flex items-center gap-xs text-on-surface/80">
                        <span className="material-symbols-outlined text-primary-container text-[14px]">check_circle</span>
                        <span>{feat}</span>
                      </div>
                      <button
                        type="button" onClick={() => handleRemoveFeature(idx)}
                        className="text-on-surface/30 hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {features.length === 0 && (
                    <p className="text-[11px] text-on-surface/30 italic uppercase">No package features added yet</p>
                  )}
                </div>

                {/* Add Feature Input */}
                <div className="flex gap-xs">
                  <input
                    type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g. Free Cardio Section"
                    className="bg-surface-container-lowest border border-white/10 px-sm py-[6px] text-white text-[12px] focus:border-primary-container/50 outline-none transition-all font-body-md flex-grow"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                  />
                  <button
                    type="button" onClick={handleAddFeature}
                    className="border border-primary-container/50 text-primary-container px-md text-[11px] font-label-bold uppercase hover:bg-primary-container/10 transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/[0.08] pt-md flex items-center justify-end gap-sm">
                <button
                  type="button" onClick={() => setShowEditModal(false)}
                  className="border border-white/20 text-white font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
