import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedLayout from './components/layout/ProtectedLayout';

import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import WardMonitorPage    from './pages/WardMonitorPage';
import PatientsPage       from './pages/PatientsPage';
import PatientDetailPage  from './pages/PatientDetailPage';
import DevicesPage        from './pages/DevicesPage';
import DeviceDetailPage   from './pages/DeviceDetailPage';
import NursesPage         from './pages/NursesPage';
import NurseDetailPage    from './pages/NurseDetailPage';
import AlertsPage         from './pages/AlertsPage';
import ReportsPage        from './pages/ReportsPage';
import SettingsPage       from './pages/SettingsPage';
import NotificationsPage  from './pages/NotificationsPage';

// ── Full-screen spinner shown while auth state loads ──
function SplashLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface-alt">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        <p className="text-text-secondary text-sm">Loading Smart IV Drip...</p>
      </div>
    </div>
  );
}

// ── Root redirect — waits for auth check before deciding ──
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SplashLoader />;
  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login"    replace />;
}

// ── Public route — redirects to dashboard if already logged in ──
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SplashLoader />;
  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public — only accessible when NOT logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected — only accessible when logged in */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/ward-monitor"  element={<WardMonitorPage />} />
          <Route path="/patients"      element={<PatientsPage />} />
          <Route path="/patients/:id"  element={<PatientDetailPage />} />
          <Route path="/devices"       element={<DevicesPage />} />
          <Route path="/devices/:id"   element={<DeviceDetailPage />} />
          <Route path="/nurses"        element={<NursesPage />} />
          <Route path="/nurses/:id"    element={<NurseDetailPage />} />
          <Route path="/alerts"        element={<AlertsPage />} />
          <Route path="/reports"       element={<ReportsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />

      </Routes>
    </BrowserRouter>
  );
}
