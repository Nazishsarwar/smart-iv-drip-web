import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const severityConfig = {
  critical: { color: 'text-status-critical', bg: 'bg-red-50',    icon: AlertTriangle },
  warning:  { color: 'text-status-warn',     bg: 'bg-orange-50', icon: Clock },
  info:     { color: 'text-primary',         bg: 'bg-blue-50',   icon: CheckCircle },
};

export default function RecentAlertsFeed({ alerts = [] }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display font-600 text-text-primary text-base">Recent Alerts</h3>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <CheckCircle className="w-8 h-8 mb-2 text-status-ok" />
            <p className="text-sm">No recent alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const cfg = severityConfig[alert.severity] || severityConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={alert._id} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-alt transition-colors">
                <div className={`${cfg.bg} rounded-full p-1.5 flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{alert.type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-text-secondary truncate">{alert.patientName || 'Unknown Patient'}</p>
                </div>
                <span className={`text-xs font-medium ${cfg.color} flex-shrink-0`}>
                  {alert.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
