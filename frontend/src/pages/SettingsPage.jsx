import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Users,
  ShieldCheck,
  RotateCcw,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  Info,
  Lock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api';

export default function SettingsPage({ currentUser, onResetDemo }) {
  const [settings, setSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Editable settings form state
  const [workspaceName, setWorkspaceName] = useState('Korvix Global Enterprise Digital Twin');
  const [criticalThreshold, setCriticalThreshold] = useState('15.0');
  const [warningThreshold, setWarningThreshold] = useState('8.0');
  const [freshnessDays, setFreshnessDays] = useState('7');
  const [autoRiskDetection, setAutoRiskDetection] = useState(true);

  const isAdmin = currentUser?.role_id === 'ADMIN';
  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const st = await api.getSettings();
      setSettings(st);

      // Populate local form state
      st.forEach(item => {
        if (item.key === 'workspace_name') setWorkspaceName(item.value);
        if (item.key === 'kpi_critical_threshold_percent') setCriticalThreshold(item.value);
        if (item.key === 'kpi_warning_threshold_percent') setWarningThreshold(item.value);
        if (item.key === 'data_freshness_threshold_days') setFreshnessDays(item.value);
        if (item.key === 'risk_auto_detection') setAutoRiskDetection(item.value === 'true');
      });

      if (!isEmployee) {
        try {
          const logs = await api.getAuditLogs();
          setAuditLogs(logs);
        } catch (e) {
          console.warn('Audit logs restricted for non-admin', e);
        }
      }

      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    try {
      await api.updateSetting('workspace_name', workspaceName);
      await api.updateSetting('kpi_critical_threshold_percent', criticalThreshold);
      await api.updateSetting('kpi_warning_threshold_percent', warningThreshold);
      await api.updateSetting('data_freshness_threshold_days', freshnessDays);
      await api.updateSetting('risk_auto_detection', String(autoRiskDetection));

      setSaveSuccess('Configuration changes saved successfully to backend SQLite database.');
      setTimeout(() => setSaveSuccess(''), 4000);
      fetchSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmReset = async () => {
    try {
      await onResetDemo();
      setShowResetConfirm(false);
      fetchSettingsData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">System Configuration & Administration</h2>
          <p className="text-xs text-slate-500">Manage workspace profile, operational thresholds, permissions, and audit logs</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Initial State</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {isEmployee ? (
        <div className="space-y-6">
          {/* Employee Profile & Clearance Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base">
                  AC
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser?.name || 'Alex Chen'}</h3>
                  <p className="text-xs text-slate-500">{currentUser?.title || 'Senior Cloud Systems Architect'}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-xs font-mono font-bold">
                Clearance: EMPLOYEE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Assigned Department</span>
                <div className="font-bold text-slate-800 mt-1">Engineering &amp; Architecture</div>
                <span className="text-[10px] text-slate-400 font-mono">DEP-ENG</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Authorized Initiatives</span>
                <div className="font-bold text-slate-800 mt-1">PRJ-101 &amp; PRJ-105</div>
                <span className="text-[10px] text-slate-400">Cloud Migration &amp; Zero Trust</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Authentication Identity</span>
                <div className="font-bold text-slate-800 mt-1">{currentUser?.email || 'employee@korvix.demo'}</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Active Contributor Session</span>
              </div>
            </div>
          </div>

          {/* Access Policy & Guard Panel */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">Administrative Capabilities Guarded</h3>
                <p className="text-xs text-amber-700">Enterprise security policies enforce role separation</p>
              </div>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              Global workspace settings, system-wide risk trigger thresholds (KPI tolerances, freshness intervals), corporate audit logs, and demo database resets are strictly restricted to <strong>Administrator</strong> credentials. Your account operates under an <strong>Individual Contributor</strong> profile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <span className="font-bold text-slate-900 block mb-2">Your Active Contributor Permissions:</span>
                <ul className="space-y-2 text-slate-600 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>View assigned projects (PRJ-101, PRJ-105) &amp; technical milestones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Toggle completion status of your technical milestones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Query AI Copilot on engineering metrics and blockers</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                <span className="font-bold text-slate-900 block mb-2">Restricted Administrative Privileges:</span>
                <ul className="space-y-2 text-slate-500 text-[11px]">
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Modifying KPI risk sensitivity thresholds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Viewing confidential corporate audit trails (HTTP 403)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Wiping or resetting demo database state</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Role Access Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Configured Role Permissions Hierarchy</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">RBAC MATRIX</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <span className="font-bold text-indigo-900 block">ADMINISTRATOR</span>
                <span className="text-[10px] font-mono text-indigo-600 font-bold">admin@korvix.demo</span>
                <p className="text-[11px] text-slate-600 mt-1">Full control over workspace settings, department CRUD, audits, and reset.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <span className="font-bold text-emerald-900 block">MANAGER</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">manager@korvix.demo</span>
                <p className="text-[11px] text-slate-600 mt-1">Department oversight, project creation, milestone updates, and risk mitigation.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-sky-300 bg-sky-100/50 ring-2 ring-sky-400">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-950 block">EMPLOYEE (Active)</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-600 text-white">YOU</span>
                </div>
                <span className="text-[10px] font-mono text-sky-800 font-bold">employee@korvix.demo</span>
                <p className="text-[11px] text-slate-700 mt-1">Scoped to assigned engineering initiatives and contributor milestone toggling.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workspace & Operational Thresholds Form */}
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Workspace &amp; Thresholds Configuration</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">Settings DB</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Workspace Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KPI Critical Threshold (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!isAdmin}
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Triggers critical severity breach</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KPI Warning Threshold (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!isAdmin}
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Triggers operational warning</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Freshness Window (Days)</label>
                  <input
                    type="number"
                    disabled={!isAdmin}
                    value={freshnessDays}
                    onChange={(e) => setFreshnessDays(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Days before record is considered stale</span>
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block font-semibold text-slate-700 mb-1.5">Auto Risk Detection</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={autoRiskDetection}
                      onChange={(e) => setAutoRiskDetection(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">Evaluate rules on data mutations</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Active AI Engine Architecture</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800">Deterministic Local Demo Engine</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              )}
            </form>

            {/* User Roles & Permissions Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">3 Roles Configured</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900">ADMINISTRATOR (Full Scope)</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800">ADMIN</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Workspace configuration, department CRUD, project deletion, audit log access, and demo database reset.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">MANAGER (Department Scope)</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">MANAGER</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Project creation, milestone updates, status modification, KPI monitoring, and full AI Copilot query access.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900">EMPLOYEE (Assigned Scope)</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-200 text-sky-800">EMPLOYEE</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    View assigned deliverables, toggle personal milestone completion, and role-scoped read operations.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                Role validation is enforced on backend endpoints. Unauthorized mutations return HTTP 403 Forbidden.
              </div>
            </div>
          </div>

          {/* Live System Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
                <p className="text-xs text-slate-500">Persistent log of administrative actions, data mutations, and demo resets</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events</span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Event ID</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Entity Type</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{log.log_id}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity_type}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{log.user_name}</td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px]">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Reset Demo Database?</h3>
            <p className="text-xs text-slate-500">
              This will restore the original pristine demonstration dataset (4 departments, 6 projects, overdue milestones, and open risks) for your faculty presentation.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg border hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
