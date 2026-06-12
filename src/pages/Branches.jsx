import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_BRANCHES = [
  { id: 1, name: "K Mark's Gym - Downtown", location: 'Downtown City Center', manager: 'Sarah Connor', status: 'Active', contact: '+1 234 567 8901', members: 450, staff: 12 },
  { id: 2, name: "K Mark's Gym - Westside", location: 'Westside Plaza', manager: 'Mike Tyson', status: 'Active', contact: '+1 234 567 8902', members: 320, staff: 8 },
  { id: 3, name: "K Mark's Gym - North Park", location: 'North Park Ave', manager: 'Emily Blunt', status: 'Setup', contact: '+1 234 567 8903', members: 0, staff: 3 },
  { id: 4, name: "K Mark's Gym - East End", location: 'East End Industrial', manager: 'John Matrix', status: 'Maintenance', contact: '+1 234 567 8904', members: 210, staff: 6 },
];

function Branches() {
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    branch.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Setup': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Maintenance': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface border-white/10';
    }
  };

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status === 'Active').length;
  const totalMembers = branches.reduce((sum, branch) => sum + branch.members, 0);
  const totalStaff = branches.reduce((sum, branch) => sum + branch.staff, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-gutter pb-32"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-sm">
        <div>
          <h1 className="text-3xl font-heading font-bold text-on-surface mb-xs">Branches</h1>
          <p className="text-on-surface/60 font-body text-sm">Manage all gym locations from one place.</p>
        </div>
        <button className="btn-primary flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Branch
        </button>
      </div>

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter mb-lg">
        {/* Total Branches */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full blur-[30px] group-hover:bg-white/20 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">storefront</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Branches</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalBranches}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            <span className="text-green-500 text-xs font-bold">+1</span>
            <span className="text-on-surface/40 text-xs">this year</span>
          </div>
        </div>

        {/* Active Branches */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-green-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">check_circle</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Active Branches</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{activeBranches}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 w-[50%] h-full rounded-full"></div>
            </div>
            <span className="text-green-500 text-xs font-bold whitespace-nowrap">50% Utilization</span>
          </div>
        </div>

        {/* Total Members */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-cyan-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-cyan-500/20 rounded-full blur-[30px] group-hover:bg-cyan-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-cyan-500/15 group-hover:text-cyan-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]">groups</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Members</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalMembers}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="material-symbols-outlined text-cyan-500 text-[16px]">trending_up</span>
             <span className="text-on-surface/60 text-xs">Across all locations</span>
          </div>
        </div>

        {/* Total Staff */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-yellow-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-yellow-500/20 rounded-full blur-[30px] group-hover:bg-yellow-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">badge</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Staff</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{totalStaff}</h2>
            </div>
          </div>
          <div className="mt-sm flex items-center gap-xs relative z-10 h-[24px]">
             <span className="text-yellow-500 text-xs font-bold">Trainers & Admins</span>
          </div>
        </div>
      </section>

      {/* FILTER AND TABLE SECTION */}
      <section className="bg-surface-container border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header & Filters */}
        <div className="p-md border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-sm">
          <h2 className="font-heading font-bold text-lg text-on-surface">Location Directory</h2>
          
          <div className="flex flex-col sm:flex-row gap-sm">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search branches..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px] bg-surface border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface/50">
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Branch Name</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Location</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Manager</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Status</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Contact</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr 
                  key={branch.id} 
                  className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                      </div>
                      <span className="font-bold text-on-surface text-sm">{branch.name}</span>
                    </div>
                  </td>
                  <td className="p-sm text-sm text-on-surface/70">{branch.location}</td>
                  <td className="p-sm text-sm text-on-surface/70">{branch.manager}</td>
                  <td className="p-sm">
                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(branch.status)}`}>
                      {branch.status}
                    </span>
                  </td>
                  <td className="p-sm text-sm text-on-surface/70">{branch.contact}</td>
                  <td className="p-sm text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-green-500 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-xl text-center text-on-surface/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 block opacity-50">search_off</span>
                    <p>No branches found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}

export default Branches;
