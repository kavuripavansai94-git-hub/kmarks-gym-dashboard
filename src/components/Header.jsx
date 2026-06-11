import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Header() {
  const { user } = useContext(AppContext);
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options).toUpperCase());
  }, []);

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Admin Dashboard';
    if (path.includes('members')) return 'Members Management';
    if (path.includes('trainers')) return 'Trainers Directory';
    if (path.includes('payments')) return 'Payments Ledger';
    if (path.includes('attendance')) return 'Attendance Tracking';
    if (path.includes('announcements')) return 'Announcements Hub';
    return 'Admin Portal';
  };

  return (
    <header className="flex justify-between items-center h-20 px-lg sticky top-0 bg-surface border-b border-outline z-40">
      <h2 className="font-headline-md text-headline-md text-primary-container font-bold uppercase tracking-wide">
        {getTitle()}
      </h2>
      <div className="flex items-center gap-md">
        <p className="font-label-bold text-label-sm text-on-surface-variant opacity-80 uppercase tracking-widest hidden md:block">
          {currentDate}
        </p>
        <div className="flex items-center gap-base">
          <button className="p-xs text-on-surface hover:text-primary-container transition-colors active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-xs text-on-surface hover:text-primary-container transition-colors active:scale-95">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="flex items-center gap-sm border-l border-outline pl-md">
            <div className="w-10 h-10 border border-outline overflow-hidden bg-surface-container shrink-0">
              <img
                alt="Admin Profile"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-label-bold text-[12px] uppercase leading-none text-white">
                {user ? user.username : 'Admin User'}
              </p>
              <p className="text-[10px] text-outline uppercase tracking-wider">
                {user ? user.role : 'Super Administrator'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
