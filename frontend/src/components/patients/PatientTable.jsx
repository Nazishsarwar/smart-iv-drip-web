import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Play } from 'lucide-react';

const statusBadge = {
  normal:   'bg-green-50 text-status-ok border-green-200',
  warning:  'bg-orange-50 text-status-warn border-orange-200',
  critical: 'bg-red-50 text-status-critical border-red-200',
  offline:  'bg-slate-50 text-status-offline border-slate-200',
  inactive: 'bg-slate-50 text-status-offline border-slate-200',
};

export default function PatientTable({ patients = [], onStartSession }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {['Patient', 'Ward / Bed', 'Diagnosis', 'Status', 'Device', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-text-secondary text-sm">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p._id} className="hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary">Age {p.age} · {p.gender}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.ward} / {p.bedNumber}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{p.diagnosis || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusBadge[p.status] || statusBadge.inactive}`}>
                      {p.status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs font-mono">
                    {p.activeDevice || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/patients/${p._id}`)}
                        className="p-1.5 rounded-control hover:bg-blue-50 text-text-secondary hover:text-primary transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!p.activeSession && (
                        <button
                          onClick={() => onStartSession(p)}
                          className="p-1.5 rounded-control hover:bg-green-50 text-text-secondary hover:text-status-ok transition-colors"
                          title="Start IV session"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
