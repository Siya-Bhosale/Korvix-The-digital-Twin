/**
 * Korvix API Client
 * Centralized fetch wrapper handling authentication tokens,
 * role headers, and error handling.
 */

const BASE_URL = '/api';

export const api = {
  getToken() {
    return localStorage.getItem('korvix_token') || 'admin@korvix.demo';
  },

  setToken(token) {
    localStorage.setItem('korvix_token', token);
  },

  clearToken() {
    localStorage.removeItem('korvix_token');
    localStorage.removeItem('korvix_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('korvix_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        // fallback
      }
    }
    return {
      user_id: 'USR-001',
      name: 'Dr. Sarah Jenkins',
      email: 'admin@korvix.demo',
      role_id: 'ADMIN',
      department_id: 'DEP-ENG',
      title: 'Chief Technology Officer & Admin'
    };
  },

  setCurrentUser(user) {
    localStorage.setItem('korvix_user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  },

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // Overview
  getOverview(period = 'Q4 2026') {
    return this.request(`/dashboard/overview?period=${encodeURIComponent(period)}`);
  },

  // Digital Twin
  getTwinGraph() {
    return this.request('/digital-twin/graph');
  },

  // Departments
  getDepartments() {
    return this.request('/departments');
  },

  getDepartment(id) {
    return this.request(`/departments/${id}`);
  },

  createDepartment(data) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateDepartment(id, data) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteDepartment(id) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects
  getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/projects${query ? `?${query}` : ''}`);
  },

  getProject(id) {
    return this.request(`/projects/${id}`);
  },

  createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  toggleMilestone(id) {
    return this.request(`/milestones/${id}/toggle`, {
      method: 'PUT'
    });
  },

  addMilestone(data) {
    return this.request('/milestones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Risks
  getRisks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/risks${query ? `?${query}` : ''}`);
  },

  updateRiskStatus(id, data) {
    return this.request(`/risks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // AI Copilot
  copilotChat(message) {
    return this.request('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Reports
  getReportsSummary() {
    return this.request('/reports/summary');
  },

  // Settings
  getSettings() {
    return this.request('/settings');
  },

  updateSetting(key, value) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  },

  getAuditLogs() {
    return this.request('/audit-logs');
  },

  getUsers() {
    return this.request('/users');
  },

  resetDemo() {
    return this.request('/demo/reset', {
      method: 'POST'
    });
  }
};
