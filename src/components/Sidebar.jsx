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
    { path: '/attendance', name: 'Attendance', icon: 'calendar_today' },
    { path: '/announcements', name: 'Announcements', icon: 'campaign' },
    { path: '/analytics', name: 'Analytics', icon: 'bar_chart' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface flex flex-col py-lg z-50">
      {/* Branding */}
      <div className="px-md mb-xl flex justify-center">
        <div className="bg-transparent" style={{ padding: '8px 16px', borderRadius: '8px' }}>
          <img 
            src="/kmarks-logo.png" 
            style={{ width: '150px', height: '70px', objectFit: 'contain' }} 
            alt="K Mark's Gym Logo" 
          />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-sm px-md py-sm font-label-bold text-label-bold uppercase transition-all duration-150 active:scale-95 text-left ${
                isActive
                  ? 'border-l-4 border-primary-container bg-surface-container-highest text-primary-container'
                  : 'text-on-surface hover:bg-surface-container hover:text-primary-container opacity-70 hover:opacity-100'
              }`
            }
          >
            <span className="material-symbols-outlined mr-md">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings & Logout button at the bottom */}
      <div className="px-md mt-auto flex flex-col gap-sm">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-sm py-sm font-label-bold text-label-bold uppercase transition-colors duration-200 text-left active:scale-95 ${
              isActive
                ? 'text-primary-container'
                : 'text-on-surface hover:text-primary-container opacity-70 hover:opacity-100'
            }`
          }
        >
          <span className="material-symbols-outlined mr-md">settings</span>
          <span>Settings</span>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-sm py-sm font-label-bold text-label-bold uppercase text-on-surface hover:text-error opacity-70 hover:opacity-100 transition-colors duration-200 text-left active:scale-95"
        >
          <span className="material-symbols-outlined mr-md">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
