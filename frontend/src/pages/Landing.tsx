// ForgeFit AI - Premium Landing Page (v4.3)

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Sparkles, TrendingUp, Flame, CheckCircle, Smartphone } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 selection:bg-brand-blue selection:text-white overflow-hidden relative">
      
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />

      {/* 1. Header Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white">
            F
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            FORGEFIT<span className="text-brand-purple">.AI</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors">
            Login
          </Link>
          <Link to="/signup" className="glass-btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/5 text-brand-blue font-bold text-xs tracking-wider uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Next-Generation Fitness Ecosystem
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-8">
          Forge Your Elite Body with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan">
            Adaptive AI Intelligence
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Combine hyper-personalized workout splits, real-time RPE tracking, supplement streakers, and interactive Three.js 3D anatomy models into a unified command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-brand-blue hover:bg-blue-700 text-white rounded-2xl font-bold shadow-glow-blue transition-all active:scale-95 text-center">
            Start Free Onboarding
          </Link>
          <a href="#pricing" className="w-full sm:w-auto px-8 py-4 border border-white/10 hover:bg-white/5 text-slate-300 rounded-2xl font-bold transition-all text-center">
            View Tiers
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-28 text-left">
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">12 Fitness Engines</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Readiness index, muscle fatigue models, progressive overload checkers, and creatine log compliance working in sync.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-5">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Offline-First PWA</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Installs on iOS & Android. Logs workouts, water, and supplements offline with auto-caching sync.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-5">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Supabase Secure</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Full Row Level Security, secure session tokens, audit tracking, and diagnostic monitoring reports.
            </p>
          </div>
        </section>

        {/* Pricing Matrix */}
        <section id="pricing" className="max-w-5xl mx-auto pt-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-4">
            Subscription Tier Structure
          </h2>
          <p className="text-slate-400 text-center mb-16 max-w-lg mx-auto">
            Upgrade your fitness capacities with unlimited AI Coach feedback.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Free */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xl text-white mb-2">Free Core</h4>
                <div className="text-3xl font-extrabold text-white mb-6">$0 <span className="text-sm font-normal text-slate-500">/ forever</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-blue" /> 5 daily AI Coach prompts</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-blue" /> Basic workout tracking</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-blue" /> PWA local support</li>
                </ul>
              </div>
              <Link to="/signup" className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl text-center block transition-all">
                Select Free
              </Link>
            </div>

            {/* Pro */}
            <div className="glass-panel p-8 rounded-3xl border-2 border-brand-blue/50 bg-[#121320] flex flex-col justify-between relative shadow-glow-blue">
              <div className="absolute top-4 right-4 bg-brand-blue text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <div>
                <h4 className="font-extrabold text-xl text-white mb-2">Pro Lifter</h4>
                <div className="text-3xl font-extrabold text-white mb-6">$9.99 <span className="text-sm font-normal text-slate-500">/ month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2.5 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-brand-blue" /> Unlimited AI Coach</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-brand-blue" /> Full recovery analytics</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-brand-blue" /> 3D Anatomy muscle details</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-brand-blue" /> Streak saver backups</li>
                </ul>
              </div>
              <Link to="/signup" className="w-full py-3 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl text-center block transition-all">
                Upgrade to Pro
              </Link>
            </div>

            {/* Coach */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xl text-white mb-2">Professional Coach</h4>
                <div className="text-3xl font-extrabold text-white mb-6">$29.99 <span className="text-sm font-normal text-slate-500">/ month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-purple" /> Client management (50 max)</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-purple" /> Custom client challenges</li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400"><CheckCircle className="w-4 h-4 text-brand-purple" /> Direct messaging capabilities</li>
                </ul>
              </div>
              <Link to="/signup" className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl text-center block transition-all">
                Deploy Coach Console
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        <p>&copy; 2026 ForgeFit AI. All rights reserved. Designed for elite athletes worldwide.</p>
      </footer>
    </div>
  );
}
