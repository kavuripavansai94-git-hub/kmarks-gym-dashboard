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
          <img src="/kmarks-logo.png" style={{ width: '200px', height: 'auto', marginBottom: '16px' }} alt="K Mark's Gym Logo" />
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
