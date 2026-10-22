import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Info, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@korvix.demo');
  const [password, setPassword] = useState('korvix123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    {
      role: 'ADMIN',
      email: 'admin@korvix.demo',
      name: 'Dr. Sarah Jenkins',
      desc: 'Full workspace authority, department & project CRUD, audit trails, and settings',
      color: 'border-indigo-500/50 hover:bg-indigo-50/50'
    },
    {
      role: 'MANAGER',
      email: 'manager@korvix.demo',
      name: 'Marcus Vance',
      desc: 'VP of Engineering, project management, milestone tracking, and AI Copilot',
      color: 'border-emerald-500/50 hover:bg-emerald-50/50'
    },
    {
      role: 'EMPLOYEE',
      email: 'employee@korvix.demo',
      name: 'Alex Chen',
      desc: 'Cloud Architect, role-scoped project visibility, milestone status view',
      color: 'border-sky-500/50 hover:bg-sky-50/50'
    }
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      api.setCurrentUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('korvix123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header with Custom Korvix Geometric Branding */}
        <div className="bg-[#0B132B] px-8 py-7 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-600/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/30 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold tracking-wider font-mono">KORVIX</h2>
          <p className="text-xs text-indigo-300 font-medium mt-0.5">Intelligence Behind Every Decision</p>
          <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-[11px] text-indigo-200">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>AI-Powered Enterprise Digital Twin Prototype</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-7">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* 1-Click Demo Account Quick Selector for Faculty Presentation */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Demo Role for Faculty Presentation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => selectDemoAccount(acc.email)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                    }`}
                  >
                    <div className="font-bold text-slate-800">{acc.role}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Demo Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="name@korvix.demo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Demo Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Session...</span>
              ) : (
                <>
                  <span>Enter Enterprise Digital Twin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Academic Prototype Notice */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>College Demo Prototype:</strong> Authentication is preconfigured for live academic evaluation. Role permissions are enforced on both backend API routes and frontend interface views.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
