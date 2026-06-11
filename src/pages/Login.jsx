import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Login() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-margin-mobile font-body-md text-on-surface">
      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-surface-container border border-white/10 p-md md:p-lg flex flex-col shadow-2xl relative overflow-hidden">
        {/* Branding Accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-lg">
          {/* Custom SVG Gym Logo */}
          <svg className="w-20 h-20 mb-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="45" width="70" height="10" fill="#F5C200" />
            {/* Dumbbell plates */}
            <rect x="15" y="25" width="10" height="50" rx="2" fill="#FFFFFF" />
            <rect x="5" y="30" width="10" height="40" rx="2" fill="#F5C200" />
            <rect x="75" y="25" width="10" height="50" rx="2" fill="#FFFFFF" />
            <rect x="85" y="30" width="10" height="40" rx="2" fill="#F5C200" />
            {/* Logo text K M */}
            <text x="50" y="52" fill="#1A1A1A" fontSize="11" fontFamily="Oswald" fontWeight="bold" textAnchor="middle">K MARK</text>
          </svg>
          <h1 className="font-headline-lg text-[32px] font-bold text-white uppercase tracking-tight">IRON ADMIN</h1>
          <p className="font-label-bold text-label-sm text-outline uppercase tracking-wider">K Mark's Gym Portal</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-md">
          {error && (
            <div className="p-sm bg-error-container border border-error text-error text-center font-label-bold text-xs uppercase">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-bold uppercase text-secondary">Email</label>
            <div className="relative flex items-center bg-surface-container-lowest brutalist-border brutalist-border-focus px-sm">
              <span className="material-symbols-outlined text-outline">mail</span>
              <input
                type="email"
                placeholder="ENTER EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-sm px-xs placeholder:text-outline/40 uppercase"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-bold uppercase text-secondary">Password</label>
            <div className="relative flex items-center bg-surface-container-lowest brutalist-border brutalist-border-focus px-sm">
              <span className="material-symbols-outlined text-outline">lock</span>
              <input
                type="password"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-sm px-xs placeholder:text-outline/40 uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full heavy-btn bg-primary-container text-on-primary font-headline-md text-headline-md py-sm uppercase hover:brightness-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] mt-md"
          >
            Access Portal
          </button>
        </form>

        <div className="mt-lg text-center">
          <p className="text-[10px] text-outline uppercase tracking-wide">
            authorized personnel only • demo credentials: admin / admin
          </p>
        </div>
      </div>
    </div>
  );
}
