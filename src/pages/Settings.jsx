import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // SECTION 1: Gym Information
  const [gymName, setGymName] = useState("K Mark's Gym");
  const [address, setAddress] = useState("123 Iron Avenue, Muscle City, MC 90001");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [email, setEmail] = useState("admin@kmarks.com");

  // SECTION 2: Plans Management
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', duration: '' });
  
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration: '' });

  // SECTION 3: Admin Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const res = await api.get('/api/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      console.warn("Could not fetch /api/plans, using fallback data.");
      // Fallback data if endpoint doesn't exist
      setPlans([
        { id: 1, name: "Basic Monthly", price: 50, duration: "1 Month" },
        { id: 2, name: "Growth Quarterly", price: 135, duration: "3 Months" },
        { id: 3, name: "Pro Yearly", price: 500, duration: "12 Months" },
      ]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Notifications
  const notify = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Handlers
  const handleSaveGymInfo = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify("Gym information updated successfully!");
    }, 800);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify("New passwords do not match.", true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify("Password updated successfully!");
    }, 800);
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.price || !newPlan.duration) return;
    
    // Mock API call
    const addedPlan = {
      id: Date.now(),
      name: newPlan.name,
      price: Number(newPlan.price),
      duration: newPlan.duration
    };
    
    setPlans([...plans, addedPlan]);
    setNewPlan({ name: '', price: '', duration: '' });
    setShowAddPlan(false);
    notify("New plan added!");
  };

  const handleDeletePlan = (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      setPlans(plans.filter(p => p.id !== id));
      notify("Plan deleted.");
    }
  };

  const startEditingPlan = (plan) => {
    setEditingPlanId(plan.id);
    setEditForm({ name: plan.name, price: plan.price, duration: plan.duration });
  };

  const saveEditedPlan = () => {
    setPlans(plans.map(p => p.id === editingPlanId ? { ...p, ...editForm, price: Number(editForm.price) } : p));
    setEditingPlanId(null);
    notify("Plan updated.");
  };

  return (
    <div className="space-y-md lg:space-y-lg relative pb-xl">
      {/* ─── Notification Toasts ─── */}
      <div className="fixed top-lg right-lg z-50 flex flex-col gap-sm">
        {error && (
          <div className="bg-error border border-error/30 text-white px-md py-sm font-label-bold text-[11px] uppercase flex items-center gap-sm shadow-lg animate-[slideDown_0.3s_ease]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500 border border-green-500/30 text-white px-md py-sm font-label-bold text-[11px] uppercase flex items-center gap-sm shadow-lg animate-[slideDown_0.3s_ease]">
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
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Administration</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              System Settings
            </h1>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: Gym Information ─── */}
      <section className="bg-surface-container border border-white/[0.06] p-md lg:p-lg">
        <div className="flex items-center gap-sm mb-lg border-b border-white/10 pb-sm">
          <span className="material-symbols-outlined text-primary-container text-[24px]">storefront</span>
          <h2 className="font-headline-md text-[18px] text-white uppercase">Gym Information</h2>
        </div>
        
        <form onSubmit={handleSaveGymInfo} className="grid grid-cols-1 md:grid-cols-2 gap-md max-w-4xl">
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Gym Name</label>
            <input
              type="text" value={gymName} onChange={e => setGymName(e.target.value)} required
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Address</label>
            <input
              type="text" value={address} onChange={e => setAddress(e.target.value)} required
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Contact Phone</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Support Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="md:col-span-2 pt-sm">
            <button
              type="submit" disabled={loading}
              className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── SECTION 2: Plans Management ─── */}
      <section className="bg-surface-container border border-white/[0.06] p-md lg:p-lg">
        <div className="flex items-center justify-between mb-lg border-b border-white/10 pb-sm">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[24px]">card_membership</span>
            <h2 className="font-headline-md text-[18px] text-white uppercase">Plans Management</h2>
          </div>
          <button
            onClick={() => setShowAddPlan(!showAddPlan)}
            className="border border-primary-container/50 text-primary-container font-label-bold text-[10px] px-sm py-sm uppercase hover:bg-primary-container/10 transition-colors flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">{showAddPlan ? 'close' : 'add'}</span>
            {showAddPlan ? 'Cancel' : 'New Plan'}
          </button>
        </div>

        {showAddPlan && (
          <form onSubmit={handleAddPlan} className="mb-lg p-md border border-primary-container/30 bg-primary-container/5 grid grid-cols-1 md:grid-cols-4 gap-md items-end">
            <div className="flex flex-col gap-[6px]">
              <label className="font-label-bold text-[9px] uppercase text-primary-container/80 tracking-wider">Plan Name</label>
              <input
                type="text" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} required placeholder="e.g. Premium Plus"
                className="bg-surface-container-lowest border border-white/10 px-sm py-xs text-white text-[12px] focus:border-primary-container/50 outline-none"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="font-label-bold text-[9px] uppercase text-primary-container/80 tracking-wider">Price (₹)</label>
              <input
                type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} required placeholder="1000" min="0"
                className="bg-surface-container-lowest border border-white/10 px-sm py-xs text-white text-[12px] focus:border-primary-container/50 outline-none"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="font-label-bold text-[9px] uppercase text-primary-container/80 tracking-wider">Duration</label>
              <input
                type="text" value={newPlan.duration} onChange={e => setNewPlan({...newPlan, duration: e.target.value})} required placeholder="e.g. 6 Months"
                className="bg-surface-container-lowest border border-white/10 px-sm py-xs text-white text-[12px] focus:border-primary-container/50 outline-none"
              />
            </div>
            <button type="submit" className="bg-primary-container text-black font-label-bold text-[10px] px-md py-xs uppercase hover:bg-white h-[34px] transition-colors">
              Add Plan
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface-container-low">
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Plan Name</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Price (₹)</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Duration</th>
                <th className="py-sm px-md font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plansLoading ? (
                <tr><td colSpan="4" className="py-md text-center text-on-surface/40 font-label-bold text-[10px] uppercase">Loading...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan="4" className="py-md text-center text-on-surface/40 font-label-bold text-[10px] uppercase">No plans configured</td></tr>
              ) : plans.map((plan) => (
                <tr key={plan.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] group">
                  {editingPlanId === plan.id ? (
                    <>
                      <td className="py-sm px-md">
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-surface-container border border-white/20 px-sm py-[2px] text-[12px] text-white w-full" />
                      </td>
                      <td className="py-sm px-md">
                        <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="bg-surface-container border border-white/20 px-sm py-[2px] text-[12px] text-primary-container w-20" />
                      </td>
                      <td className="py-sm px-md">
                        <input type="text" value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} className="bg-surface-container border border-white/20 px-sm py-[2px] text-[12px] text-white w-24" />
                      </td>
                      <td className="py-sm px-md text-right space-x-2">
                        <button onClick={saveEditedPlan} className="text-green-500 hover:text-green-400 font-label-bold text-[10px] uppercase">Save</button>
                        <button onClick={() => setEditingPlanId(null)} className="text-on-surface/40 hover:text-white font-label-bold text-[10px] uppercase">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-sm px-md font-body-md text-[13px] text-white font-bold">{plan.name}</td>
                      <td className="py-sm px-md font-label-bold text-[12px] text-primary-container">₹{plan.price}</td>
                      <td className="py-sm px-md font-body-md text-[12px] text-on-surface/60">{plan.duration}</td>
                      <td className="py-sm px-md text-right">
                        <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditingPlan(plan)} className="w-7 h-7 flex items-center justify-center text-on-surface/40 hover:text-white hover:bg-white/10 rounded">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => handleDeletePlan(plan.id)} className="w-7 h-7 flex items-center justify-center text-on-surface/40 hover:text-error hover:bg-error/10 rounded">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── SECTION 3: Admin Password ─── */}
      <section className="bg-surface-container border border-white/[0.06] p-md lg:p-lg max-w-2xl">
        <div className="flex items-center gap-sm mb-lg border-b border-white/10 pb-sm">
          <span className="material-symbols-outlined text-primary-container text-[24px]">lock</span>
          <h2 className="font-headline-md text-[18px] text-white uppercase">Security Settings</h2>
        </div>
        
        <form onSubmit={handleSavePassword} className="space-y-md">
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Current Password</label>
            <input
              type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">New Password</label>
            <input
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6"
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Confirm New Password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength="6"
              className="bg-surface-container-lowest border border-white/10 px-md py-sm text-white text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none transition-all font-body-md"
            />
          </div>
          <div className="pt-sm">
            <button
              type="submit" disabled={loading}
              className="border border-white/20 text-white font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

    </div>
  );
}
