import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-status-ok' : 'bg-status-offline'}`} />
        <span className="text-xs text-text-secondary">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-control hover:bg-surface-alt transition-colors"
        >
          <Bell className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'Admin'}</p>
            <p className="text-xs text-text-secondary capitalize">{user?.role || 'supervisor'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-control text-sm text-text-secondary hover:text-status-critical hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
