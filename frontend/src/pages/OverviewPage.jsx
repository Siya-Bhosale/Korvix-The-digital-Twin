import React, { useState, useEffect } from 'react';
import {
  Activity,
  FolderKanban,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Database,
  ExternalLink
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../api';

export default function OverviewPage({ onNavigate, currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2026');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getOverview(selectedPeriod);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedPeriod]);

  if (loading && !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Synchronizing Enterprise Digital Twin telemetry...</span>
        </div>
      </div>
    );
  }

  const { summary, performance_trend, project_status, dept_snapshots, upcoming_milestones, top_risks, data_quality } = data || {};
  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  // Status pie chart colors
  const STATUS_COLORS = {
    'Completed': '#10B981',
    'In Progress': '#3B82F6',
    'At Risk': '#EF4444',
    'Planned': '#94A3B8'
  };

  const projectStatusData = project_status ? Object.entries(project_status).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Role-Based Scoping Notice for Employee */}
      {isEmployee && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-600 text-white">EMPLOYEE SCOPE</span>
            <span>
              <strong>Role Access Active:</strong> Displaying only initiatives, milestones, and risks assigned to <strong>Alex Chen (Engineering &amp; Architecture)</strong>. Cross-department financial and operational data is restricted.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-sky-700 hidden sm:inline">RBAC Clearance: Level 1</span>
        </div>
      )}

      {/* Top Filter & Data Freshness Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {isEmployee ? 'My Assigned Delivery Telemetry: Active' : 'Digital Twin Telemetry Status: Online'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluated at {data_quality?.last_updated || 'Just now'} • {data_quality?.disclaimer}
            </p>
          </div>
        </div>

        {/* Reporting Period Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Reporting Cycle:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Q4 2026">Q4 2026 (Active Quarter)</option>
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q2 2026">Q2 2026</option>
            <option value="Q1 2026">Q1 2026</option>
            <option value="FY 2026">Full Fiscal Year 2026</option>
          </select>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Operational Health Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Health</span>
            <div className={`p-1.5 rounded-lg ${summary?.health_score >= 80 ? 'bg-emerald-50 text-emerald-600' : (summary?.health_score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{summary?.health_score}</span>
            <span className="text-xs font-medium text-slate-500">/ 100</span>
          </div>
          {/* Health Bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary?.health_score >= 80 ? 'bg-emerald-500' : (summary?.health_score >= 60 ? 'bg-amber-500' : 'bg-rose-500')
              }`}
              style={{ width: `${summary?.health_score}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Deductions: {summary?.overdue_milestones_count || 0} overdue items</span>
            <span className="font-semibold text-slate-700">{summary?.health_score >= 70 ? 'Operational' : 'At Risk'}</span>
          </p>
        </div>

        {/* 2. Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{summary?.active_projects}</span>
            <span className="text-xs font-medium text-slate-500">in execution</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>2 cross-department initiatives</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total initiatives monitored across 4 units</p>
        </div>

        {/* 3. Open Risks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Risks</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{summary?.open_risks}</span>
            <span className="text-xs font-medium text-rose-600 font-semibold">2 Critical</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Requires operational mitigation</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Auto-evaluated against rule thresholds</p>
        </div>

        {/* 4. Goal Progress Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Goal Progress</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{summary?.goal_progress}%</span>
            <span className="text-xs font-medium text-slate-500">milestones weight</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${summary?.goal_progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Aggregated across all active projects</p>
        </div>
      </div>

      {/* Row 2: Performance Trend & Project Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. PERFORMANCE TREND LINE CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Performance & KPI Achievement Trend</h3>
              <p className="text-xs text-slate-500">Quarterly target achievement vs actual delivery score</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                <span className="text-slate-600 font-medium">Actual (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
                <span className="text-slate-600 font-medium">Target Baseline (%)</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance_trend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="actual" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. PROJECT STATUS CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Status Distribution</h3>
            <p className="text-xs text-slate-500">Live breakdown of current initiative states</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B132B', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {projectStatusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }}></span>
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-bold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Department Snapshot & Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* D. DEPARTMENT SNAPSHOT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Departmental Performance Matrix</h3>
              <p className="text-xs text-slate-500">Comparative KPI attainment and average progress</p>
            </div>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {dept_snapshots?.map((dept) => (
              <div
                key={dept.department_id}
                onClick={() => onNavigate('departments')}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/70 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: dept.color }}></div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{dept.name}</h4>
                    <span className="text-[11px] text-slate-500">{dept.cost_centre} • {dept.total_projects} Projects</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{dept.avg_progress}%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Avg Progress</div>
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${dept.kpi_achievement >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {dept.kpi_achievement}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">KPI Met</div>
                  </div>
                </div>
              </div>
            ))}
            {isEmployee && (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-slate-200 text-slate-600 font-bold text-[10px]">RESTRICTED</span>
                  <span>Operations, Finance &amp; People Operations (3 Departments Protected)</span>
                </div>
                <span className="text-[10px] text-slate-400">Admin/Manager Scope</span>
              </div>
            )}
          </div>
        </div>

        {/* E. UPCOMING & OVERDUE MILESTONES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Critical Milestone Schedules</h3>
              <p className="text-xs text-slate-500">Upcoming deliveries with automatic overdue detection</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcoming_milestones?.map((m) => (
              <div
                key={m.milestone_id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  m.is_overdue
                    ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                    : (m.status === 'Completed' ? 'border-emerald-200 bg-emerald-50/40 text-slate-800' : 'border-slate-200 bg-white text-slate-800')
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {m.status === 'Completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : m.is_overdue ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${m.is_overdue ? 'text-rose-900' : 'text-slate-800'}`}>{m.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.project_name} • Owner: {m.owner_name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.is_overdue
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : (m.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')
                  }`}>
                    {m.status}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">Due {m.due_date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* C. RISK MONITOR TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active High-Priority Operational Risks</h3>
            <p className="text-xs text-slate-500">Identified through transparent deterministic detection rules</p>
          </div>
          <button
            onClick={() => onNavigate('risk-monitor')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open Risk Monitor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Risk ID</th>
                <th className="py-2.5 px-3">Risk Title & Description</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Mitigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top_risks?.map((r) => (
                <tr key={r.risk_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{r.risk_id}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <span className="text-[11px] text-slate-400">{r.category}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{r.project_name || 'Organization'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : (r.severity === 'High' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{r.owner_name || 'Unassigned'}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={r.mitigation}>
                    {r.mitigation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
