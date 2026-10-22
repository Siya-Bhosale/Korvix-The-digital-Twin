import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FolderKanban,
  Target,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  DollarSign,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function DepartmentsPage({ onNavigate, currentUser }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptDetail, setDeptDetail] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeForm, setActiveForm] = useState({
    department_id: '',
    name: '',
    cost_centre: '',
    manager_id: 'USR-002',
    description: '',
    budget: 1000000,
    color: '#3B82F6',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');

  const isAdmin = currentUser?.role_id === 'ADMIN';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openDetail = async (dept) => {
    setSelectedDept(dept);
    try {
      const detail = await api.getDepartment(dept.department_id);
      setDeptDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.createDepartment(activeForm);
      setShowCreateModal(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.updateDepartment(activeForm.department_id, activeForm);
      setShowEditModal(false);
      fetchDepartments();
      if (selectedDept?.department_id === activeForm.department_id) {
        openDetail(activeForm);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteDepartment(selectedDept.department_id);
      setShowDeleteModal(false);
      setSelectedDept(null);
      setDeptDetail(null);
      fetchDepartments();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.cost_centre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Organizational Departments</h2>
          <p className="text-xs text-slate-500">Corporate units, assigned capital, headcount, and active KPI targets</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none w-56 transition"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setActiveForm({
                  department_id: `DEP-${Math.floor(100 + Math.random() * 900)}`,
                  name: '',
                  cost_centre: `CC-${Math.floor(100 + Math.random() * 900)}`,
                  manager_id: 'USR-002',
                  description: '',
                  budget: 750000,
                  color: '#4F46E5',
                  status: 'Active'
                });
                setShowCreateModal(true);
              }}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Based Scoping Notice for Employee */}
      {currentUser?.role_id === 'EMPLOYEE' && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-600 text-white">HOME DEPARTMENT ONLY</span>
            <span>
              <strong>Employee Scope:</strong> Displaying your home operational department (<strong>Engineering &amp; Architecture</strong>). Corporate Finance, Operations, and People Operations require Manager or Administrator authorization.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-sky-700">Engineering Contributor</span>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredDepts.map((d) => (
          <div
            key={d.department_id}
            onClick={() => openDetail(d)}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {currentUser?.role_id === 'EMPLOYEE' ? 'CC-RESTRICTED' : d.cost_centre}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {d.status}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3.5 h-10 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                    {d.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Headcount</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.employee_count} Members</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Projects</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.project_count} Initiatives</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">KPI Met</span>
                <span className={`block font-bold ${d.kpi_achievement >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {d.kpi_achievement}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Open Risks</span>
                <span className={`block font-bold ${d.open_risks > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {d.open_risks}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Locked Departments Card for Employee */}
        {currentUser?.role_id === 'EMPLOYEE' && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 flex flex-col justify-between text-slate-400">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                  PROTECTED
                </span>
                <span className="text-[10px] font-bold text-slate-500">Restricted</span>
              </div>
              <h3 className="text-sm font-bold text-slate-600">3 Corporate Units Hidden</h3>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Global Operations, Corporate Finance, and People Operations are outside your individual clearance scope.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400">
              Requires Manager or Admin elevation
            </div>
          </div>
        )}
      </div>

      {/* Selected Department Details Drawer / Modal */}
      {selectedDept && deptDetail && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-8 rounded-full" style={{ backgroundColor: selectedDept.color }}></div>
                <div>
                  <h3 className="text-base font-bold">{selectedDept.name}</h3>
                  <span className="text-xs text-slate-400">{selectedDept.department_id} • Cost Centre: {selectedDept.cost_centre}</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedDept(null); setDeptDetail(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-base font-extrabold text-slate-900">${deptDetail.budget?.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 uppercase mt-0.5">Annual Budget</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-base font-extrabold text-slate-900">{deptDetail.projects?.length || 0}</div>
                  <div className="text-[11px] text-slate-500 uppercase mt-0.5">Assigned Projects</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-base font-extrabold text-slate-900">{deptDetail.employees?.length || 0}</div>
                  <div className="text-[11px] text-slate-500 uppercase mt-0.5">Staff Members</div>
                </div>
              </div>

              {/* Associated Projects */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assigned Projects</h4>
                <div className="space-y-2">
                  {deptDetail.projects?.map((p) => (
                    <div key={p.project_id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <p className="text-[11px] text-slate-500">{p.project_id} • Priority: {p.priority}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-indigo-600">{p.progress}%</span>
                        <div className="text-[10px] text-slate-500">{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Team */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department Personnel</h4>
                <div className="grid grid-cols-2 gap-2">
                  {deptDetail.employees?.map((u) => (
                    <div key={u.user_id} className="p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{u.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {isAdmin && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveForm(selectedDept);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Department</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Department</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Department Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{showCreateModal ? 'Create New Department' : 'Edit Department'}</h3>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{formError}</div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Identifier (ID)</label>
                <input
                  type="text"
                  required
                  disabled={showEditModal}
                  value={activeForm.department_id}
                  onChange={(e) => setActiveForm({ ...activeForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={activeForm.name}
                  onChange={(e) => setActiveForm({ ...activeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Artificial Intelligence Research"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Centre</label>
                  <input
                    type="text"
                    required
                    value={activeForm.cost_centre}
                    onChange={(e) => setActiveForm({ ...activeForm, cost_centre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={activeForm.budget}
                    onChange={(e) => setActiveForm({ ...activeForm, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={activeForm.description}
                  onChange={(e) => setActiveForm({ ...activeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {showCreateModal ? 'Create Department' : 'Save Changes'}
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
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{selectedDept?.name}</strong>? This will remove its digital twin representation and unlink projects.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg border hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
