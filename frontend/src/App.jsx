import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import OverviewPage from './pages/OverviewPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ProjectsPage from './pages/ProjectsPage';
import AICopilotPage from './pages/AICopilotPage';
import RiskMonitorPage from './pages/RiskMonitorPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setShowLoginModal(true);
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    showToast(`Logged in as ${user.name} (${user.role_id})`);
  };

  const handleSwitchRole = async (targetEmail) => {
    try {
      const data = await api.login(targetEmail, 'korvix123');
      api.setToken(data.token);
      api.setCurrentUser(data.user);
      setCurrentUser(data.user);
      showToast(`Switched active demo role to ${data.user.role_id}`);
    } catch (err) {
      console.error('Failed to switch role', err);
    }
  };

  const handleResetDemoData = async () => {
    try {
      await api.resetDemo();
      showToast('Pristine demo dataset restored successfully');
      // Trigger refresh of active view by re-mounting or state change
      const current = activeTab;
      setActiveTab('overview');
      setTimeout(() => setActiveTab(current), 50);
    } catch (err) {
      alert(`Demo reset failed: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Login Screen / Modal */}
      {showLoginModal && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <Header
          activeTab={activeTab}
          onNavigate={(tab) => setActiveTab(tab)}
          currentUser={currentUser}
          onResetDemo={handleResetDemoData}
        />

        {/* Global Action Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
            {toastMessage}
          </div>
        )}

        {/* Active Page View */}
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          {activeTab === 'overview' && (
            <OverviewPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'digital-twin' && (
            <DigitalTwinPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'departments' && (
            <DepartmentsPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'projects' && (
            <ProjectsPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'copilot' && (
            <AICopilotPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'risk-monitor' && (
            <RiskMonitorPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'reports' && (
            <ReportsPage onNavigate={(tab) => setActiveTab(tab)} currentUser={currentUser} />
          )}
          {activeTab === 'settings' && (
            <SettingsPage currentUser={currentUser} onResetDemo={handleResetDemoData} />
          )}
        </main>
      </div>
    </div>
  );
}
