import React from 'react';

export default function Announcements() {
  return (
    <div className="space-y-lg relative">
      <section className="relative overflow-hidden border border-white/5 bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-md lg:py-md lg:px-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div>
            <p className="font-label-bold text-[10px] text-primary-container uppercase tracking-[0.3em] mb-xs">Communication</p>
            <h1 className="font-headline-lg text-[28px] lg:text-[32px] text-white uppercase tracking-tight leading-none">
              Announcements
            </h1>
          </div>
        </div>
      </section>

      <div className="bg-surface-container border border-white/[0.06] p-xl flex flex-col items-center justify-center min-h-[400px] text-center">
        <span className="material-symbols-outlined text-on-surface/15 text-[64px] mb-md">campaign</span>
        <h2 className="font-headline-md text-white uppercase mb-sm">Announcements Coming Soon</h2>
        <p className="font-body-md text-on-surface/60 max-w-md">The announcements module is under construction. Soon you will be able to broadcast messages and updates to all your members.</p>
      </div>
    </div>
  );
}
