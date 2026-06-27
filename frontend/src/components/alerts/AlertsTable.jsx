import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Eye } from 'lucide-react';

const severityConfig = {
  critical: { badge: 'bg-red-50 text-status-critical border-red-200',   icon: AlertTriangle, iconColor: 'text-status-critical' },
  warning:  { badge: 'bg-orange-50 text-status-warn border-orange-200', icon: Clock,         iconColor: 'text-status-warn' },
  info:     { badge: 'bg-blue-50 text-primary border-blue-200',         icon: CheckCircle,   iconColor: 'text-primary' },
};

const statusConfig = {
  active:       'bg-red-50 text-status-critical border-red-200',
  acknowledged: 'bg-orange-50 text-status-warn border-orange-200',
  resolved:     'bg-green-50 text-status-ok border-green-200',
};

const statusLabel = {
  active:       'Unresolved',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

export default function AlertsTable({ alerts = [], onAcknowledge, onResolve, onView }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {['Severity', 'Type', 'Patient', 'Ward', 'Time', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-text-secondary text-sm">
                  No alerts found.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const sev  = severityConfig[alert.severity] || severityConfig.info;
                const Icon = sev.icon;
                return (
                  <tr key={alert._id} className="hover:bg-surface-alt transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${sev.iconColor}`} />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${sev.badge}`}>
                          {alert.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary capitalize">
                      {alert.type?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{alert.patientName || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{alert.ward || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusConfig[alert.status] || statusConfig.active}`}>
                        {statusLabel[alert.status] || alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onView(alert)}
                          className="p-1.5 rounded-control hover:bg-blue-50 text-text-secondary hover:text-primary transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {alert.status === 'active' && (
                          <button
                            onClick={() => onAcknowledge(alert._id)}
                            className="px-2 py-1 rounded-control text-xs bg-orange-50 text-status-warn hover:bg-orange-100 transition-colors"
                          >
                            Ack
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => onResolve(alert)}
                            className="px-2 py-1 rounded-control text-xs bg-green-50 text-status-ok hover:bg-green-100 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
