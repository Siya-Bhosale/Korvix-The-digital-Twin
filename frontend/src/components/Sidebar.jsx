import React from 'react';
import {
  LayoutDashboard,
  Network,
  Building2,
  FolderKanban,
  Bot,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, onSwitchRole }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Digital Twin', icon: Network },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'projects', label: 'Projects & Goals', icon: FolderKanban },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, badge: 'AI' },
    { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert, badge: 'Rules' },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const roleColors = {
    ADMIN: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    MANAGER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    EMPLOYEE: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  };

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800/80 shadow-xl z-20">
      {/* Brand Identity / Wordmark */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/60 bg-[#091024]">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
          {/* Geometric Custom Twin Hexagon Glyph */}
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-white text-lg font-mono">KORVIX</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v2.4</span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-tight">Intelligence Behind Every Decision</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Enterprise Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Role Drawer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#091024]">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Demo User</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${roleColors[currentUser?.role_id] || roleColors.EMPLOYEE}`}>
              {currentUser?.role_id || 'DEMO'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow">
              {currentUser?.avatar_initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'KX'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-100 truncate">{currentUser?.name || 'Dr. Sarah Jenkins'}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'admin@korvix.demo'}</p>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex gap-1">
            <button
              onClick={() => onSwitchRole('admin@korvix.demo')}
              title="Switch to Admin"
              className={`flex-1 py-1 text-[10px] rounded font-medium transition ${
                currentUser?.role_id === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onSwitchRole('manager@korvix.demo')}
              title="Switch to Manager"
              className={`flex-1 py-1 text-[10px] rounded font-medium transition ${
                currentUser?.role_id === 'MANAGER' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => onSwitchRole('employee@korvix.demo')}
              title="Switch to Employee"
              className={`flex-1 py-1 text-[10px] rounded font-medium transition ${
                currentUser?.role_id === 'EMPLOYEE' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Employee
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}
