import React, { useState, useEffect } from 'react';
import {
  Network,
  Building2,
  Users,
  FolderKanban,
  Target,
  ShieldAlert,
  ArrowRight,
  Search,
  Filter,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  GitCommit,
  GitBranch
} from 'lucide-react';
import { api } from '../api';

export default function DigitalTwinPage({ onNavigate, currentUser }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const res = await api.getTwinGraph();
      setGraphData(res);
      // Default selected node: Organization
      if (res.nodes && res.nodes.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load twin graph', err);
    } finally {
      setLoading(false);
    }
  };

  const nodeIcons = {
    organization: Building2,
    department: Building2,
    employee: Users,
    project: FolderKanban,
    kpi: Target,
    risk: ShieldAlert
  };

  const nodeColors = {
    organization: 'bg-indigo-900 text-white border-indigo-700',
    department: 'bg-blue-50 text-blue-900 border-blue-300',
    employee: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    project: 'bg-purple-50 text-purple-900 border-purple-300',
    kpi: 'bg-amber-50 text-amber-900 border-amber-300',
    risk: 'bg-rose-50 text-rose-900 border-rose-300'
  };

  // Filter nodes
  const filteredNodes = graphData?.nodes?.filter((node) => {
    const matchesFilter = filterType === 'ALL' || node.type.toUpperCase() === filterType;
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          node.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  // Connected edges for the selected node
  const connectedEdges = graphData?.edges?.filter(
    (e) => e.source === selectedNode?.id || e.target === selectedNode?.id
  ) || [];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50">
      {/* Main Graph & Hierarchy Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-5">
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enterprise Digital Twin Architecture</h2>
              <p className="text-[11px] text-slate-500">Live bidirectional graph of departments, projects, and risks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEmployee && (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-sky-100 text-sky-800 border border-sky-200 text-xs font-mono font-bold">
                EMPLOYEE SCOPE
              </span>
            )}

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-100 text-xs rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white outline-none w-44 transition"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              {['ALL', 'DEPARTMENT', 'PROJECT', 'KPI', 'RISK'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                    filterType === type ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'ALL' ? 'All Entities' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Scoping Banner */}
        {isEmployee && (
          <div className="p-4 bg-sky-50 border border-sky-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-800 font-mono font-bold text-[10px] shrink-0">
                EMPLOYEE SCOPE
              </div>
              <div>
                <div className="font-bold text-sky-950">
                  Engineering Subnet Topology: {currentUser?.name || 'Alex Chen'}
                </div>
                <div className="text-sky-700 text-[11px] mt-0.5">
                  Displaying digital twin nodes and relational edges for your home department (Engineering &amp; Architecture), assigned projects (PRJ-101: Cloud Native Migration, PRJ-105: Zero Trust Architecture), and corresponding technical milestones. Corporate nodes for Finance, Operations, and HR are protected by security policy.
                </div>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono text-[10px] font-bold self-start sm:self-auto">
              {filteredNodes.length} Nodes Surfaced / 24 Restricted
            </span>
          </div>
        )}

        {/* Informative Guidance Banner */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Digital Twin Navigation:</strong> Click any node below to inspect its live state, parent department, linked goals, and active risks.
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">{filteredNodes.length} Nodes Displayed</span>
        </div>

        {/* Digital Twin Node Grid / Visual Graph View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-8">
          {filteredNodes.map((node) => {
            const Icon = nodeIcons[node.type] || Layers;
            const isSelected = selectedNode?.id === node.id;
            const colorClass = nodeColors[node.type] || 'bg-white text-slate-800 border-slate-200';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative bg-white ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg border ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{node.category}</div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{node.label}</h3>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    node.status === 'Completed' || node.status === 'Active' || node.status === 'On Track'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (node.status === 'At Risk' || node.severity === 'Critical' || node.status === 'Breached'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600')
                  }`}>
                    {node.status || node.severity || 'Normal'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{node.id}</span>
                  <div className="flex items-center gap-1 text-indigo-600 font-semibold group">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })}

          {isEmployee && (
            <div className="col-span-full p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Corporate Subnets Protected:</strong> 24 nodes across Global Operations (PRJ-102), Human Resources (PRJ-104), and Corporate Finance are hidden by security policy.
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">RBAC ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Entity Inspection Drawer */}
      <div className="w-full md:w-96 bg-white border-l border-slate-200/90 flex flex-col shrink-0 h-full overflow-y-auto shadow-lg z-10">
        {selectedNode ? (
          <div className="p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedNode.category} Entity
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2 tracking-tight">{selectedNode.label}</h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedNode.id}</p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Operational State */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Live Telemetry State</h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Health Status:</span>
                  <span className="font-bold text-slate-800">{selectedNode.status || 'Active'}</span>
                </div>
                {selectedNode.details && Object.entries(selectedNode.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interconnected Twin Relationships */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Connected Relationships ({connectedEdges.length})</h4>
              {connectedEdges.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-xl">No explicit relationship edges configured for this entity.</div>
              ) : (
                <div className="space-y-2">
                  {connectedEdges.map((edge) => {
                    const isSource = edge.source === selectedNode.id;
                    const connectedId = isSource ? edge.target : edge.source;
                    const targetNode = graphData?.nodes?.find(n => n.id === connectedId);

                    return (
                      <div
                        key={edge.id}
                        onClick={() => targetNode && setSelectedNode(targetNode)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          edge.is_blocker
                            ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-semibold text-indigo-600">{edge.relation}</span>
                          {edge.is_blocker && (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Blocker Dependency</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{targetNode?.label || connectedId}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions based on Entity Type */}
            <div className="pt-4 border-t border-slate-200">
              {selectedNode.type === 'project' && (
                <button
                  onClick={() => onNavigate('projects')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Open in Projects & Goals</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              {selectedNode.type === 'department' && (
                <button
                  onClick={() => onNavigate('departments')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Open in Departments</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              {selectedNode.type === 'risk' && (
                <button
                  onClick={() => onNavigate('risk-monitor')}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Open in Risk Monitor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
            <Layers className="w-8 h-8 mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Select any entity</p>
            <p className="text-[11px] mt-1 text-slate-400">Click any card to inspect live telemetry and connected dependencies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
