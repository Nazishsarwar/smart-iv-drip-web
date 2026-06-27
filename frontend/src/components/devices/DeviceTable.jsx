import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react';

const statusBadge = {
  online:  'bg-green-50 text-status-ok border-green-200',
  idle:    'bg-blue-50 text-primary border-blue-200',
  offline: 'bg-slate-50 text-status-offline border-slate-200',
  error:   'bg-red-50 text-status-critical border-red-200',
};

export default function DeviceTable({ devices = [], onRefresh }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {['Device ID', 'Status', 'Location', 'Battery', 'Last Seen', 'Assigned Patient', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-text-secondary text-sm">
                  No devices registered yet.
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d._id} className="hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium text-text-primary">{d.deviceId}</p>
                    <p className="text-xs text-text-secondary">{d.macAddress || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {d.status === 'online' || d.status === 'idle'
                        ? <Wifi className="w-3.5 h-3.5 text-status-ok" />
                        : <WifiOff className="w-3.5 h-3.5 text-status-offline" />
                      }
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusBadge[d.status] || statusBadge.offline}`}>
                        {d.status || 'offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{d.location || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {(d.batteryPct || 0) < 20
                        ? <BatteryLow className="w-3.5 h-3.5 text-status-critical" />
                        : <Battery className="w-3.5 h-3.5 text-status-ok" />
                      }
                      <span className="tabular-nums text-text-primary">
                        {d.batteryPct != null ? `${d.batteryPct}%` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {d.assignedPatient?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/devices/${d._id}`)}
                      className="p-1.5 rounded-control hover:bg-blue-50 text-text-secondary hover:text-primary transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
