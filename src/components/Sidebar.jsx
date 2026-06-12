import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Sidebar() {
  const { logout } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: 'dashboard' },
    { path: '/members', name: 'Members', icon: 'group' },
    { path: '/trainers', name: 'Trainers', icon: 'fitness_center' },
    { path: '/payments', name: 'Payments', icon: 'payments' },
    { path: '/plans', name: 'Plans & Packages', icon: 'card_membership' },
    { path: '/enquiries', name: 'Enquiries / Leads', icon: 'contact_phone' },
    { path: '/expenses', name: 'Expenses Tracker', icon: 'receipt_long' },
    { path: '/branches', name: 'Branches', icon: 'storefront' },
    { path: '/analytics', name: 'Analytics', icon: 'bar_chart' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface flex flex-col pb-lg z-50">
      {/* Branding */}
      <div style={{ width: '100%', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/kmarks-logo.png" 
          style={{ width: '100%', maxWidth: '140px', height: 'auto', marginBottom: '8px' }} 
          alt="K Mark's Gym Logo" 
        />
        <div style={{ width: '100%', height: '1px', backgroundColor: '#F5C200' }}></div>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow space-y-1 mt-2 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-md py-2 font-label-bold text-[11px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 text-left ${
                isActive
                  ? 'border-l-4 border-primary-container bg-surface-container-highest text-primary-container'
                  : 'text-on-surface hover:bg-surface-container hover:text-primary-container opacity-70 hover:opacity-100'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings & Logout button at the bottom */}
      <div className="px-md mt-auto flex flex-col gap-1 pb-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 py-2 font-label-bold text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 text-left active:scale-95 ${
              isActive
                ? 'text-primary-container'
                : 'text-on-surface hover:text-primary-container opacity-70 hover:opacity-100'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2 font-label-bold text-[11px] font-bold tracking-wider uppercase text-on-surface hover:text-error opacity-70 hover:opacity-100 transition-colors duration-200 text-left active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
