import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import AlertsTable from '../components/alerts/AlertsTable';
import AlertDetailModal from '../components/alerts/AlertDetailModal';
import { getAlertsApi, acknowledgeAlertApi } from '../api/alertApi';
import { useSocket } from '../context/SocketContext';

export default function AlertsPage() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getAlertsApi({
        status:   statusFilter   !== 'all' ? statusFilter   : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });
      const data = res.data;
      setAlerts(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.alerts)
          ? data.alerts
          : []
      );
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (!socket) return;
    socket.on('alert:new',      fetchAlerts);
    socket.on('alert:resolved', fetchAlerts);
    socket.on('alert:acknowledged', fetchAlerts);
    return () => {
      socket.off('alert:new',      fetchAlerts);
      socket.off('alert:resolved', fetchAlerts);
      socket.off('alert:acknowledged', fetchAlerts);
    };
  }, [socket, fetchAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlertApi(id);
      fetchAlerts();
    } catch (err) {
      console.error('Acknowledge error:', err);
    }
  };

  const unresolvedCount = alerts.filter((a) => a.status === 'active').length;

  const statusFilters = [
    { value: 'all',          label: 'All' },
    { value: 'active',       label: 'Unresolved' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved',     label: 'Resolved' },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Alerts</h1>
          <p className="text-text-secondary text-sm mt-1">
            {unresolvedCount > 0 ? (
              <span className="text-status-critical font-medium">
                {unresolvedCount} unresolved alert{unresolvedCount > 1 ? 's' : ''} need attention
              </span>
            ) : (
              'All alerts resolved'
            )}
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary font-medium">Status:</span>
          {statusFilters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-secondary font-medium">Severity:</span>
          {['all', 'critical', 'warning', 'info'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                severityFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <AlertsTable
          alerts={alerts}
          onAcknowledge={handleAcknowledge}
          onResolve={(alert) => setSelectedAlert(alert)}
          onView={(alert) => setSelectedAlert(alert)}
        />
      )}

      {/* Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolved={fetchAlerts}
        />
      )}

    </div>
  );
}
