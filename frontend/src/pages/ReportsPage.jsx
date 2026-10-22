import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  FolderKanban,
  Target,
  ShieldAlert,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

export default function ReportsPage({ currentUser }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('ALL');

  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportsSummary();
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export utility
  const downloadCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProjectsCSV = () => {
    downloadCSV(`korvix_projects_report_${new Date().toISOString().split('T')[0]}.csv`, reportData?.projects || []);
  };

  const exportKPIsCSV = () => {
    downloadCSV(`korvix_kpi_report_${new Date().toISOString().split('T')[0]}.csv`, reportData?.kpis || []);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProjects = (reportData?.projects || []).filter(p =>
    !selectedDeptFilter || p.department === selectedDeptFilter
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Control Bar (hidden in print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Executive Reports & Analytics</h2>
          <p className="text-xs text-slate-500">Comprehensive organizational audits, performance matrix, and CSV exports</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportProjectsCSV}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
            title="Download Projects CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Projects CSV</span>
          </button>
          <button
            onClick={exportKPIsCSV}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
            title="Download KPIs CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export KPIs CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Employee Scope Alert Banner */}
      {isEmployee && (
        <div className="bg-sky-50 border border-sky-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 font-mono font-bold text-[10px] shrink-0">
              EMPLOYEE SCOPE
            </div>
            <div>
              <div className="font-bold text-sky-950">
                Individual Contributor Audit Scope: {currentUser?.name || 'Alex Chen'}
              </div>
              <div className="text-sky-700 text-[11px] mt-0.5">
                Displaying audit data and performance metrics scoped strictly to your assigned initiatives (PRJ-101: Cloud Native Migration, PRJ-105: Zero Trust Architecture). Corporate finance allocations and unassigned department initiatives are excluded by RBAC policy.
              </div>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono text-[10px] font-bold self-start sm:self-auto">
            {reportData?.projects?.length || 2} Projects Scoped
          </span>
        </div>
      )}

      {/* Report Document Container */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-8">
        {/* Document Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 font-mono tracking-wider">KORVIX</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-bold text-slate-600">Enterprise Digital Twin Intelligence</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              {isEmployee ? "Technical Contributor Delivery & Engineering Audit" : "Comprehensive Organisational Health & Delivery Audit"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated: {reportData?.generated_at} • Evaluation Cycle: Q4 2026
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              Health Index: {reportData?.health_score}/100
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Illustrative Demo Audit</div>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE HEALTH SUMMARY */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            {isEmployee ? "1. Engineering Telemetry Overview" : "1. Executive Telemetry Overview"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase">Health Score</span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-1">{reportData?.health_score} / 100</div>
              <span className="text-[10px] text-slate-400">Rule-based baseline</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase">Monitored Projects</span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-1">{reportData?.projects?.length || 0} Initiatives</div>
              <span className="text-[10px] text-slate-400">
                {isEmployee ? "Assigned Engineering scope" : "Across 4 departments"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase">Overdue Deliverables</span>
              <div className="text-lg font-mono font-bold text-rose-600 mt-1">{reportData?.overdue_milestones?.length || 0} Milestones</div>
              <span className="text-[10px] text-rose-500 font-medium">Critical schedule drag</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase">Target KPIs</span>
              <div className="text-lg font-mono font-bold text-indigo-600 mt-1">{reportData?.kpis?.length || 0} Metrics</div>
              <span className="text-[10px] text-slate-400">Tracked in Q4 2026</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PROJECT DELIVERY MATRIX */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Strategic Project Performance Summary
            </h3>
            <span className="text-[11px] text-slate-400 no-print">Exportable to CSV</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Project ID</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Target Due</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p) => (
                  <tr key={p.project_id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.project_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.department}</td>
                    <td className="py-2.5 px-3 font-medium">{p.priority}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{p.progress}%</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.due_date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        (p.status === 'At Risk' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700')
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: OVERDUE MILESTONES REPORT */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            3. Overdue Milestone Exceptions
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-rose-50/60 text-[11px] font-bold text-rose-800 uppercase tracking-wider border-b border-rose-200">
                <tr>
                  <th className="py-2.5 px-3">Milestone ID</th>
                  <th className="py-2.5 px-3">Deliverable</th>
                  <th className="py-2.5 px-3">Associated Project</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Lead Owner</th>
                  <th className="py-2.5 px-3">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.overdue_milestones?.map((m) => (
                  <tr key={m.milestone_id} className="bg-rose-50/20">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{m.milestone_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-rose-950">{m.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{m.project}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">{m.due_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{m.owner || 'Unassigned'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        OVERDUE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Footer Disclaimer */}
        <div className="pt-6 border-t border-slate-200 text-slate-400 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Korvix AI-Powered Enterprise Digital Twin Prototype</span>
          <span>{reportData?.disclaimer} • Confirmed Grounded SQLite Data</span>
        </div>
      </div>
    </div>
  );
}
