import React from 'react';
import { Activity } from 'lucide-react';

const statusColor = {
  normal:   'bg-status-ok',
  warning:  'bg-status-warn',
  critical: 'bg-status-critical',
  offline:  'bg-status-offline',
};

export default function WardOverviewCard({ ward }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-600 text-text-primary text-sm">{ward.name}</h4>
        <Activity className="w-4 h-4 text-text-secondary" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {(ward.patients || []).map((p) => (
          <div
            key={p._id}
            title={p.name}
            className={`w-3 h-3 rounded-full ${statusColor[p.status] || statusColor.offline}`}
          />
        ))}
        {(!ward.patients || ward.patients.length === 0) && (
          <p className="text-xs text-text-secondary">No active patients</p>
        )}
      </div>
      <p className="text-xs text-text-secondary mt-3">
        {ward.patients?.length || 0} active · {ward.criticalCount || 0} critical
      </p>
    </div>
  );
}
