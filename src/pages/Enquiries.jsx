import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showBanner, setShowBanner] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [status, setStatus] = useState('New');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kmarks_leads');
    if (saved) setEnquiries(JSON.parse(saved));
  }, []);

  const handleAddLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: Date.now(),
      name, phone, source, status, notes,
      date: new Date().toISOString().split('T')[0],
      followUp: '-'
    };
    const updated = [newLead, ...enquiries];
    setEnquiries(updated);
    localStorage.setItem('kmarks_leads', JSON.stringify(updated));
    setIsModalOpen(false);
    setName(''); setPhone(''); setSource('Walk-in'); setStatus('New'); setNotes('');
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = enq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          enq.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Contacted': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Trial': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Converted': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Lost': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface-variant text-on-surface border-white/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-gutter pb-32"
    >
      {showBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-md py-sm font-label-bold text-[11px] uppercase flex justify-between items-center mb-md animate-[slideDown_0.3s_ease]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Lead tracking database coming soon. You can manually add leads below.</span>
          </div>
          <button onClick={() => setShowBanner(false)} className="material-symbols-outlined text-[16px] hover:text-white transition-colors">close</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-sm">
        <div>
          <h1 className="text-3xl font-heading font-bold text-on-surface mb-xs">Enquiries & Leads</h1>
          <p className="text-on-surface/60 font-body text-sm">Manage potential members and track conversions.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Lead
        </button>
      </div>

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm lg:gap-gutter mb-lg">
        {/* Total Leads */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-primary-container/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-white/10 rounded-full blur-[30px] group-hover:bg-white/20 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-white/10 group-hover:text-white/40 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">groups</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Total Leads</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{enquiries.length}</h2>
            </div>
          </div>
        </div>

        {/* Converted */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-green-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-green-500/20 rounded-full blur-[30px] group-hover:bg-green-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-green-500/15 group-hover:text-green-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">task_alt</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Converted</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{enquiries.filter(e => e.status === 'Converted').length}</h2>
            </div>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-yellow-500/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-yellow-500/20 rounded-full blur-[30px] group-hover:bg-yellow-500/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-yellow-500/15 group-hover:text-yellow-500/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">ring_volume</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Follow-ups Today</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{enquiries.filter(e => e.followUp === new Date().toISOString().split('T')[0]).length}</h2>
            </div>
          </div>
        </div>

        {/* Lost Leads */}
        <div className="group relative bg-surface-container border border-white/[0.06] p-sm lg:p-md overflow-hidden hover:border-error/30 transition-all">
          <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center font-bold select-none group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <div className="absolute w-[100px] h-[100px] bg-error/20 rounded-full blur-[30px] group-hover:bg-error/40 transition-colors duration-700"></div>
            <span className="material-symbols-outlined text-[64px] leading-none block relative z-10 text-error/15 group-hover:text-error/50 transition-all duration-700 group-hover:drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">thumb_down</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="font-label-bold text-on-surface/40 uppercase tracking-wider text-[10px] mb-xs">Lost Leads</p>
              <h2 className="text-3xl font-heading font-bold text-on-surface">{enquiries.filter(e => e.status === 'Lost').length}</h2>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER AND TABLE SECTION */}
      <section className="bg-surface-container border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header & Filters */}
        <div className="p-md border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-sm">
          <h2 className="font-heading font-bold text-lg text-on-surface">Lead Pipeline</h2>
          
          <div className="flex flex-col sm:flex-row gap-sm">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px] bg-surface border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors"
              />
            </div>
            
            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg py-2 px-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Trial">Trial</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface/50">
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Lead Name</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Contact</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Source</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Status</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Date Added</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40">Follow-up</th>
                <th className="p-sm font-label-bold text-[11px] uppercase tracking-wider text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enq, index) => (
                <tr 
                  key={enq.id} 
                  className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container font-bold text-sm">
                        {enq.name.charAt(0)}
                      </div>
                      <span className="font-bold text-on-surface text-sm">{enq.name}</span>
                    </div>
                  </td>
                  <td className="p-sm text-sm text-on-surface/70">{enq.phone}</td>
                  <td className="p-sm text-sm text-on-surface/70">{enq.source}</td>
                  <td className="p-sm">
                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(enq.status)}`}>
                      {enq.status}
                    </span>
                  </td>
                  <td className="p-sm text-sm text-on-surface/70">{enq.date}</td>
                  <td className="p-sm text-sm">
                    <span className={enq.followUp === '2023-10-26' || enq.followUp === '2023-10-27' ? 'text-yellow-500 font-bold' : 'text-on-surface/70'}>
                      {enq.followUp}
                    </span>
                  </td>
                  <td className="p-sm text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 hover:text-green-500 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-xl text-center text-on-surface/40">
                    <span className="material-symbols-outlined text-[48px] mb-2 block opacity-50">group_add</span>
                    <p>No leads yet. Add your first lead.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-surface-container border border-white/10 w-full max-w-lg relative overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
            
            <div className="p-md lg:p-lg">
              <div className="flex justify-between items-start mb-md">
                <h2 className="font-headline-lg text-[24px] text-white uppercase tracking-tight">New Lead</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface/30 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-md">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none w-full" />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Phone *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none w-full" />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div className="flex flex-col gap-[6px]">
                    <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Source</label>
                    <select value={source} onChange={e => setSource(e.target.value)} className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none w-full">
                      <option value="Walk-in">Walk-in</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Referral">Referral</option>
                      <option value="Website">Website</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none w-full">
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Trial">Trial</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-label-bold text-[10px] uppercase text-on-surface/40 tracking-wider">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-surface-container-lowest border border-white/10 px-md py-sm text-on-surface text-[13px] focus:border-primary-container/50 focus:ring-0 outline-none w-full h-24 resize-none"></textarea>
                </div>

                <div className="pt-sm flex justify-end">
                  <button type="submit" className="bg-primary-container text-black font-label-bold text-[11px] px-lg py-md uppercase hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                    Save Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Enquiries;
