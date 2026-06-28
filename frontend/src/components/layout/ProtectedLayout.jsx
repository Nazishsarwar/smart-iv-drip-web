import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar    from './Sidebar';
import TopNavbar  from './TopNavbar';

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

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  // Wait for localStorage check to finish
  if (loading) return <SplashLoader />;

  // Not authenticated — send to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-surface-alt overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
