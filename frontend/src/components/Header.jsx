import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export default function Header({ activeTab, onNavigate, currentUser, onResetDemo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const pageTitles = {
    overview: { title: 'Overview Dashboard', subtitle: 'Real-time organizational health & performance telemetry' },
    'digital-twin': { title: 'Organizational Digital Twin', subtitle: 'Connected graph visualization across departments, projects, and risks' },
    departments: { title: 'Departments & Workforce', subtitle: 'Operational units, leadership, headcount, and KPI targets' },
    projects: { title: 'Projects & Goals', subtitle: 'Active strategic initiatives, milestone schedules, and blockers' },
    copilot: { title: 'AI Copilot Intelligence', subtitle: 'Conversational organizational query engine grounded in live database' },
    'risk-monitor': { title: 'Operational Risk Monitor', subtitle: 'Transparent rule-based detection for milestones, KPIs, and dependencies' },
    reports: { title: 'Executive Reports & Analytics', subtitle: 'Health audits, status summaries, CSV data export, and print reports' },
    settings: { title: 'Settings & Administration', subtitle: 'Workspace profile, role permissions, thresholds, and audit trail' }
  };

  const currentInfo = pageTitles[activeTab] || pageTitles.overview;

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search handler
  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const res = await fetch(`/api/projects`);
      const projects = await res.json();
      const matchedPrjs = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

      const deptRes = await fetch(`/api/departments`);
      const depts = await deptRes.json();
      const matchedDepts = depts.filter(d => d.name.toLowerCase().includes(q.toLowerCase()));

      setSearchResults({
        projects: matchedPrjs,
        departments: matchedDepts
      });
      setShowSearchDropdown(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0 z-10">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{currentInfo.title}</h1>
            <span className="text-[11px] font-medium text-slate-500 hidden md:inline">/</span>
            <span className="text-xs font-medium text-slate-500 hidden md:inline">{currentInfo.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-4">
        {/* Global Live Search */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, departments..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery && setShowSearchDropdown(true)}
              className="w-64 pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs text-slate-800 rounded-lg border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Search Results
              </div>
              {searchResults.projects.length === 0 && searchResults.departments.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">No matching records found.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.projects.map(p => (
                    <button
                      key={p.project_id}
                      onClick={() => {
                        onNavigate('projects');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.project_id} • {p.status}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
                  {searchResults.departments.map(d => (
                    <button
                      key={d.department_id}
                      onClick={() => {
                        onNavigate('departments');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">{d.name}</p>
                        <p className="text-[11px] text-slate-500">{d.department_id} • Cost Centre: {d.cost_centre}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demo Data Disclaimer Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-medium shadow-xs">
          <Info className="w-3 h-3 text-amber-600" />
          <span>Illustrative Demo Mode</span>
        </div>

        {/* Workspace Selector */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Global Twin v2.4</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Recent Alerts (3)</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer" onClick={() => onNavigate('risk-monitor')}>View Risk Monitor</span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Overdue Milestone MLS-02</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">EU Kubernetes Cluster is 3 days past target schedule.</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>KPI Breach: Order Fulfillment</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">Cycle time 31.5 hrs exceeds critical threshold.</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Demo State Operational</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">Automated rules engine synced with SQLite.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demo Reset Quick Action */}
        <button
          onClick={onResetDemo}
          title="Restore Pristine Demo Data"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Reset Demo</span>
        </button>
      </div>
    </header>
  );
}
