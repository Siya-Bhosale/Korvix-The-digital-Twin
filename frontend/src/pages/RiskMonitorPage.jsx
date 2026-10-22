import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  User,
  Building,
  Info,
  Edit2,
  Check,
  X,
  Layers,
  ChevronDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function RiskMonitorPage({ onNavigate, currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Risk for Mitigation / Status Update Modal
  const [editingRisk, setEditingRisk] = useState(null);
  const [editStatus, setEditStatus] = useState('Active');
  const [editMitigation, setEditMitigation] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [users, setUsers] = useState([]);

  const canManage = currentUser?.role_id === 'ADMIN' || currentUser?.role_id === 'MANAGER';
  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getRisks(params);
      setData(res);

      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [severityFilter, categoryFilter, statusFilter]);

  const handleOpenEdit = (risk) => {
    setEditingRisk(risk);
    setEditStatus(risk.status);
    setEditMitigation(risk.mitigation || '');
    setEditOwner(risk.owner_id || 'USR-002');
  };

  const handleSaveRiskStatus = async (e) => {
    e.preventDefault();
    try {
      await api.updateRiskStatus(editingRisk.risk_id, {
        status: editStatus,
        mitigation: editMitigation,
        owner_id: editOwner
      });
      setEditingRisk(null);
      fetchRisks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcknowledge = async (riskId) => {
    try {
      await api.updateRiskStatus(riskId, {
        status: 'Under Review'
      });
      fetchRisks();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredRisks = data?.risks?.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.risk_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.project_name && r.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Employee Scope Alert Banner */}
      {isEmployee && (
        <div className="bg-sky-50 border border-sky-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 font-mono font-bold text-[10px] shrink-0">
              EMPLOYEE SCOPE
            </div>
            <div>
              <div className="font-bold text-sky-950">
                Operational Risk Scope: {currentUser.name} (Engineering & Architecture)
              </div>
              <div className="text-sky-700 text-[11px] mt-0.5">
                Displaying only operational risks impacting your assigned engineering initiatives (PRJ-101: Cloud Native Migration, PRJ-105: Zero Trust Architecture). 4 enterprise-wide corporate and logistics risks are hidden by RBAC policy.
              </div>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono text-[10px] font-bold self-start sm:self-auto">
            2 Assigned Risks / 4 Restricted
          </span>
        </div>
      )}

      {/* Header and Rule Engine Description */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Transparent Operational Risk Monitor</h2>
              <p className="text-xs text-slate-500">
                Rule-based operational risk detection with verifiable evidence criteria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Prioritization Index:</span>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Health: {data?.health_score}/100
            </span>
          </div>
        </div>

        {/* 5 Deterministic Rules Explanation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <strong className="block text-slate-800 font-bold">Rule A: Overdue Milestones</strong>
            <span className="text-slate-500 text-[10px]">Due date &lt; today &amp; status != Completed</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <strong className="block text-slate-800 font-bold">Rule B: KPI Breaches</strong>
            <span className="text-slate-500 text-[10px]">Actual crosses critical or warning target</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <strong className="block text-slate-800 font-bold">Rule C: Dependency Blockers</strong>
            <span className="text-slate-500 text-[10px]">Required predecessor incomplete</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <strong className="block text-slate-800 font-bold">Rule D: Missing / Stale Data</strong>
            <span className="text-slate-500 text-[10px]">Empty owner or update &gt; 14 days</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <strong className="block text-slate-800 font-bold">Rule E: Schedule Variance</strong>
            <span className="text-slate-500 text-[10px]">Actual % lags elapsed time % &gt; 15%</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by title, project, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Schedule">Schedule Variance</option>
            <option value="KPI Breach">KPI Threshold Breach</option>
            <option value="Dependency">Unresolved Dependency</option>
            <option value="Operational">Operational Capacity</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Realtime Detected Alerts Banner */}
      {data?.auto_detected_alerts?.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900">
                Rule Engine Realtime Detection ({data.auto_detected_alerts.length} Conditions Triggered)
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Evaluated against live SQLite database</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.auto_detected_alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-amber-200 text-xs shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-500">{alert.rule_id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    alert.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 line-clamp-1">{alert.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{alert.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Evidence: {alert.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Risks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Operational Risk Register ({filteredRisks.length})</h3>
          <span className="text-xs text-slate-500">Click any risk row to acknowledge, assign owner, or add mitigation notes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Risk ID & Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Project / Dept</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Triggering Rule</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRisks.map((r) => (
                <tr key={r.risk_id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[11px] font-bold text-slate-800">{r.risk_id}</div>
                    <div className="font-semibold text-slate-900 mt-0.5">{r.title}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{r.category}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{r.project_name || 'Organization'}</div>
                    <div className="text-[10px] text-slate-400">{r.department_name}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : (r.severity === 'High' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-xs truncate" title={r.triggering_rule}>
                    {r.triggering_rule || 'Deterministic Rule'}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{r.owner_name || 'Unassigned'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'Active'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : (r.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700')
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEmployee ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[10px] border border-slate-200">
                          Assigned Contributor
                        </span>
                      ) : (
                        <>
                          {r.status === 'Active' && canManage && (
                            <button
                              onClick={() => handleAcknowledge(r.risk_id)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                              title="Acknowledge Risk and Mark Under Review"
                            >
                              Acknowledge
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title="Update Mitigation & Status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restricted Corporate Risks Banner for Employees */}
      {isEmployee && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-200 text-slate-600">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-800">
                Restricted Operational Risks (4 Concealed by Security Clearance)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">RBAC POLICY ENFORCED</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            As an individual technical contributor, only risks attached to your assigned initiatives (Engineering &amp; Architecture) are surfaced. Corporate warehouse fulfillment breaches (RSK-002), talent attrition risks (RSK-003), vendor hardware logistics (RSK-004), and external compliance findings (RSK-005) require <strong>MANAGER</strong> or <strong>ADMIN</strong> clearance.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onNavigate && onNavigate('overview')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <span>Return to My Overview</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Mitigation / Status Update Modal */}
      {editingRisk && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-300">{editingRisk.risk_id}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{editingRisk.title}</h3>
              </div>
              <button onClick={() => setEditingRisk(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRiskStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Risk Resolution Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Active">Active (Unresolved)</option>
                  <option value="Under Review">Under Review (Supervision Active)</option>
                  <option value="Mitigated">Mitigated (Remediation In Place)</option>
                  <option value="Closed">Closed (Permanently Resolved)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Risk Owner</label>
                <select
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>{u.name} ({u.title})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mitigation Action Notes</label>
                <textarea
                  rows={3}
                  required
                  value={editMitigation}
                  onChange={(e) => setEditMitigation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  placeholder="Describe operational steps taken to mitigate this risk..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRisk(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Mitigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
