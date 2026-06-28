import React, { useEffect, useState, useCallback } from 'react';
import { Bell, RefreshCw, Trash2, AlertTriangle, Info, Clock, CheckCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useSocket } from '../context/SocketContext';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-status-critical', bg: 'bg-red-50'    },
  warning:  { icon: Clock,         color: 'text-status-warn',     bg: 'bg-orange-50' },
  info:     { icon: Info,          color: 'text-primary',         bg: 'bg-blue-50'   },
};

const statusColor = {
  active:       'text-status-critical',
  acknowledged: 'text-status-warn',
  resolved:     'text-status-ok',
};

const statusLabel = {
  active:       'Unresolved',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

function groupByDate(items) {
  return items.reduce((groups, item) => {
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});
}

export default function NotificationsPage() {
  const { socket }          = useSocket();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await axiosInstance.get('/alerts?limit=100');
      const data = res.data;

      // Handle both { alerts: [] } and plain []
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.alerts)
        ? data.alerts
        : [];

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAlerts(list);
    } catch (err) {
      console.error('Notifications fetch error:', err);
      setError('Failed to load notifications. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Live updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchAlerts();
    socket.on('alert:new',         refresh);
    socket.on('alert:resolved',    refresh);
    socket.on('alert:acknowledged',refresh);
    return () => {
      socket.off('alert:new',         refresh);
      socket.off('alert:resolved',    refresh);
      socket.off('alert:acknowledged',refresh);
    };
  }, [socket, fetchAlerts]);

  const handleClearAll = async () => {
    if (!window.confirm('Mark all unresolved alerts as resolved?')) return;
    try {
      await axiosInstance.post('/alerts/resolve-all');
      fetchAlerts();
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const grouped = groupByDate(alerts);
  const unresolvedCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Notifications
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {unresolvedCount > 0 ? (
              <span className="text-status-critical font-medium">
                {unresolvedCount} unresolved alert{unresolvedCount > 1 ? 's' : ''}
              </span>
            ) : (
              'All alerts resolved'
            )}
            {' · '}{alerts.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-4 py-2 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {unresolvedCount > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-control border border-status-critical text-status-critical text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Resolve All
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-control px-4 py-3 text-sm text-status-critical">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>

      /* Empty state */
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-card border border-border shadow-sm p-12 text-center">
          <Bell className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-text-primary font-medium">No notifications yet</p>
          <p className="text-text-secondary text-sm mt-1">
            Alerts will appear here when triggered by ESP32 readings.
          </p>
        </div>

      /* Grouped list */
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>

              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {date}
                </p>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-secondary">{items.length} alert{items.length > 1 ? 's' : ''}</span>
              </div>

              {/* Alert cards */}
              <div className="bg-white rounded-card border border-border shadow-sm divide-y divide-border">
                {items.map((alert) => {
                  const cfg  = severityConfig[alert.severity] || severityConfig.info;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={alert._id}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-surface-alt transition-colors"
                    >
                      {/* Icon */}
                      <div className={`${cfg.bg} rounded-full p-2 flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-text-primary capitalize">
                            {alert.type?.replace(/_/g, ' ') || 'Alert'}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                            alert.severity === 'critical'
                              ? 'bg-red-50 text-status-critical'
                              : alert.severity === 'warning'
                              ? 'bg-orange-50 text-status-warn'
                              : 'bg-blue-50 text-primary'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>

                        {/* Patient + Ward */}
                        <p className="text-xs text-text-secondary mt-0.5">
                          {alert.patientName || 'Unknown Patient'}
                          {alert.ward ? ` · ${alert.ward}` : ''}
                        </p>

                        {/* Message */}
                        {alert.message && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                        )}

                        {/* Resolution note */}
                        {alert.resolutionNote && alert.status === 'resolved' && (
                          <p className="text-xs text-status-ok mt-1">
                            ✓ {alert.resolutionNote}
                          </p>
                        )}
                      </div>

                      {/* Right side — time + status */}
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-xs text-text-secondary">
                          {new Date(alert.createdAt).toLocaleTimeString([], {
                            hour:   '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <span className={`text-xs font-medium block ${
                          statusColor[alert.status] || 'text-text-secondary'
                        }`}>
                          {statusLabel[alert.status] || alert.status}
                        </span>
                        {alert.acknowledgedBy?.name && (
                          <p className="text-xs text-text-secondary">
                            Ack: {alert.acknowledgedBy.name}
                          </p>
                        )}
                        {alert.resolvedBy?.name && (
                          <p className="text-xs text-text-secondary">
                            By: {alert.resolvedBy.name}
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
