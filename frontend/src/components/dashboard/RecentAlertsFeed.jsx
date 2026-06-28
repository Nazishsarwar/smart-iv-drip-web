import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react';

const severityConfig = {
  critical: {
    color: 'text-status-critical',
    bg:    'bg-red-50',
    icon:  AlertTriangle,
  },
  warning: {
    color: 'text-status-warn',
    bg:    'bg-orange-50',
    icon:  Clock,
  },
  info: {
    color: 'text-primary',
    bg:    'bg-blue-50',
    icon:  CheckCircle,
  },
};

const statusLabel = {
  active:       'Unresolved',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

const statusColor = {
  active:       'text-status-critical',
  acknowledged: 'text-status-warn',
  resolved:     'text-status-ok',
};

export default function RecentAlertsFeed({ alerts = [] }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-sm h-full flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-600 text-text-primary text-base">Recent Alerts</h3>
        {alerts.length > 0 && (
          <span className="text-xs text-text-secondary">{alerts.length} alerts</span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <Bell className="w-8 h-8 mb-2 text-status-ok" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs mt-1">No recent alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const cfg  = severityConfig[alert.severity] || severityConfig.info;
            const Icon = cfg.icon;

            return (
              <div
                key={alert._id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-surface-alt transition-colors"
              >
                {/* Icon */}
                <div className={`${cfg.bg} rounded-full p-1.5 flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary capitalize truncate">
                    {alert.type?.replace(/_/g, ' ') || 'Alert'}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {alert.patientName || 'Unknown Patient'}
                    {alert.ward ? ` · ${alert.ward}` : ''}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {new Date(alert.createdAt).toLocaleTimeString([], {
                      hour:   '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Status */}
                <span className={`text-xs font-medium flex-shrink-0 capitalize ${
                  statusColor[alert.status] || 'text-text-secondary'
                }`}>
                  {statusLabel[alert.status] || alert.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
