// ForgeFit AI - Signup Form Page (v4.3)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../services/analytics';
import { ShieldAlert, UserPlus, Lock, Mail } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);

    if (!email || !password || !confirmPassword) {
      setErr('Please fill in all registration fields.');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters long.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    const { error } = await signup(email, password);
    if (error) {
      setErr(error.message || 'Registration failed.');
      setSubmitting(false);
    } else {
      // Direct redirect to onboarding flow
      try {
        await trackEvent('User Registered', { email });
      } catch (e) {}
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-6 relative">
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-brand-purple/5 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/5 relative z-10">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              FORGEFIT<span className="text-brand-purple">.AI</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Forge Your Account</h2>
          <p className="text-sm text-slate-400 mt-1.5">Join the next-generation fitness ecosystem</p>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input 
                type="email" 
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Choose Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="glass-input pl-12"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full glass-btn-primary flex items-center justify-center gap-2 py-3 rounded-xl mt-6 text-sm font-bold disabled:opacity-50"
          >
            {submitting ? 'Registering...' : 'Register Account'}
            <UserPlus className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-brand-blue font-bold hover:underline">
            Login Session
          </Link>
        </p>

      </div>
    </div>
  );
}
