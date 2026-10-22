import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  Building,
  Edit2,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  Link2,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function ProjectsPage({ onNavigate, currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Selected Project Detail
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  const [projectForm, setProjectForm] = useState({
    project_id: '',
    name: '',
    description: '',
    owner_department: 'DEP-ENG',
    project_owner_id: 'USR-002',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
    status: 'In Progress',
    priority: 'High',
    progress: 25,
    budget: 250000
  });

  const [milestoneForm, setMilestoneForm] = useState({
    milestone_id: '',
    title: '',
    due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
    status: 'Pending',
    owner_id: 'USR-006'
  });

  const canManage = currentUser?.role_id === 'ADMIN' || currentUser?.role_id === 'MANAGER';
  const isAdmin = currentUser?.role_id === 'ADMIN';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;

      const data = await api.getProjects(params);
      setProjects(data);

      const depts = await api.getDepartments();
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedDept, selectedStatus, selectedPriority]);

  const openProjectDetail = async (prj) => {
    setSelectedProject(prj);
    try {
      const detail = await api.getProject(prj.project_id);
      setProjectDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (mId) => {
    try {
      const res = await api.toggleMilestone(mId);
      // Refresh current project detail & list
      if (selectedProject) {
        openProjectDetail(selectedProject);
      }
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.createProject(projectForm);
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await api.updateProject(projectForm.project_id, projectForm);
      setShowEditModal(false);
      fetchProjects();
      if (selectedProject?.project_id === projectForm.project_id) {
        openProjectDetail(projectForm);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.deleteProject(selectedProject.project_id);
      setShowDeleteModal(false);
      setSelectedProject(null);
      setProjectDetail(null);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await api.addMilestone({
        ...milestoneForm,
        project_id: selectedProject.project_id
      });
      setShowAddMilestoneModal(false);
      openProjectDetail(selectedProject);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Role-Based Scoping Notice for Employee */}
      {currentUser?.role_id === 'EMPLOYEE' && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-600 text-white">MY WORKSPACE</span>
            <span>
              <strong>Employee Scope:</strong> Displaying only initiatives and deliverables assigned to <strong>Alex Chen</strong> ({filteredProjects.length} active initiatives). Corporate initiatives outside your engineering portfolio are restricted.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-sky-700">Engineering Contributor</span>
        </div>
      )}

      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {currentUser?.role_id === 'EMPLOYEE' ? 'My Assigned Projects & Goals' : 'Enterprise Projects & Strategic Goals'}
            </h2>
            <p className="text-xs text-slate-500">
              {currentUser?.role_id === 'EMPLOYEE' ? 'Engineering initiatives where you are project lead or milestone owner' : 'Cross-department delivery tracks, date-aware milestones, and blockers'}
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setProjectForm({
                  project_id: `PRJ-${Math.floor(200 + Math.random() * 800)}`,
                  name: '',
                  description: '',
                  owner_department: departments[0]?.department_id || 'DEP-ENG',
                  project_owner_id: 'USR-002',
                  start_date: new Date().toISOString().split('T')[0],
                  due_date: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
                  status: 'In Progress',
                  priority: 'High',
                  progress: 20,
                  budget: 350000
                });
                setShowCreateModal(true);
              }}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Project</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search initiatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="At Risk">At Risk</option>
            <option value="Completed">Completed</option>
            <option value="Planned">Planned</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => {
          const hasOverdue = p.overdue_milestones_count > 0;
          const statusBadge = hasOverdue ? 'At Risk' : p.status;

          return (
            <div
              key={p.project_id}
              onClick={() => openProjectDetail(p)}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {p.project_id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      (p.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {p.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      statusBadge === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      (statusBadge === 'At Risk' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200')
                    }`}>
                      {statusBadge}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                  {p.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>

                {/* Overdue Alert Flag */}
                {hasOverdue && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{p.overdue_milestones_count} Overdue Milestone(s) Detected</span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[11px] text-slate-500">Progress</span>
                    <span className="font-mono font-bold text-slate-900">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.progress >= 100 ? 'bg-emerald-500' : (statusBadge === 'At Risk' ? 'bg-rose-500' : 'bg-indigo-600')
                      }`}
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[140px]">{p.department_name}</span>
                <span>Due {p.due_date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal / Timeline View */}
      {selectedProject && projectDetail && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {projectDetail.project_id}
                  </span>
                  <span className="text-xs text-slate-400">{projectDetail.department_name}</span>
                </div>
                <h3 className="text-base font-bold mt-1 text-white">{projectDetail.name}</h3>
              </div>
              <button
                onClick={() => { setSelectedProject(null); setProjectDetail(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900">{projectDetail.progress}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">Completion</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900">${projectDetail.budget?.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Allocated Budget</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900">{projectDetail.start_date}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Start Date</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900">{projectDetail.due_date}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Target Date</div>
                </div>
              </div>

              {/* Milestones Checklist / Interactive Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Project Milestones ({projectDetail.milestones?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-500">Click checkmark to toggle status and recalculate progress</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        setMilestoneForm({
                          milestone_id: `MLS-${Math.floor(20 + Math.random() * 80)}`,
                          title: '',
                          due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
                          status: 'Pending',
                          owner_id: 'USR-006'
                        });
                        setShowAddMilestoneModal(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {projectDetail.milestones?.map((m) => {
                    const isDone = m.status === 'Completed';
                    const isOverdue = m.is_overdue;

                    return (
                      <div
                        key={m.milestone_id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          isDone
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : (isOverdue ? 'bg-rose-50/60 border-rose-300' : 'bg-slate-50 border-slate-200')
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleMilestone(m.milestone_id)}
                            title={isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-indigo-500 text-transparent hover:text-indigo-500'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <div>
                            <p className={`font-semibold ${isDone ? 'line-through text-slate-500' : (isOverdue ? 'text-rose-900 font-bold' : 'text-slate-800')}`}>
                              {m.title}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              <span>Due {m.due_date}</span>
                              {m.owner_name && <span> • Owner: {m.owner_name}</span>}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : (isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700')
                        }`}>
                          {isOverdue ? 'OVERDUE' : m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dependencies section */}
              {projectDetail.dependencies?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                    Dependencies & Blockers
                  </h4>
                  <div className="space-y-2">
                    {projectDetail.dependencies.map((dep) => (
                      <div key={dep.dependency_id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-800 flex items-start gap-2">
                        <Link2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs">{dep.source_entity_id} ➔ {dep.target_entity_id} ({dep.dependency_type})</div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{dep.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {canManage && (
                <button
                  onClick={() => {
                    setProjectForm(selectedProject);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Project</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{showCreateModal ? 'Initiate New Project' : 'Edit Project Deliverables'}</h3>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateProject : handleUpdateProject} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Identifier (ID)</label>
                  <input
                    type="text"
                    required
                    disabled={showEditModal}
                    value={projectForm.project_id}
                    onChange={(e) => setProjectForm({ ...projectForm, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owning Department</label>
                  <select
                    value={projectForm.owner_department}
                    onChange={(e) => setProjectForm({ ...projectForm, owner_department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  placeholder="e.g. Next-Gen Realtime Core API"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategic Description</label>
                <textarea
                  rows={2}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={projectForm.priority}
                    onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={projectForm.progress}
                    onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={projectForm.due_date}
                    onChange={(e) => setProjectForm({ ...projectForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {showCreateModal ? 'Create Project' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add Milestone Deliverable</h3>
            <form onSubmit={handleAddMilestone} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  placeholder="e.g. Production Load Testing"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                <input
                  type="date"
                  required
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Project Deletion</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{selectedProject?.name}</strong>? All associated milestones and risks will be unlinked.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg border hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
