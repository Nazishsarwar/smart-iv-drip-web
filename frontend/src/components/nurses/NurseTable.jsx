import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UserCheck, UserX } from 'lucide-react';

const shiftBadge = {
  Morning:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Evening:  'bg-orange-50 text-status-warn border-orange-200',
  Night:    'bg-blue-50 text-primary border-blue-200',
};

export default function NurseTable({ nurses = [], onDeactivate }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              {['Nurse', 'Phone', 'Ward', 'Shift', 'Patients', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {nurses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-text-secondary text-sm">
                  No nurses registered yet.
                </td>
              </tr>
            ) : (
              nurses.map((n) => (
                <tr key={n._id} className="hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{n.name}</p>
                    <p className="text-xs text-text-secondary">{n.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{n.phone || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{n.ward || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${shiftBadge[n.shift] || 'bg-slate-50 text-text-secondary border-slate-200'}`}>
                      {n.shift || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary tabular-nums">
                    {n.assignedPatients?.length || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {n.isActive !== false
                        ? <><UserCheck className="w-3.5 h-3.5 text-status-ok" /><span className="text-xs text-status-ok">Active</span></>
                        : <><UserX className="w-3.5 h-3.5 text-status-offline" /><span className="text-xs text-status-offline">Inactive</span></>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/nurses/${n._id}`)}
                        className="p-1.5 rounded-control hover:bg-blue-50 text-text-secondary hover:text-primary transition-colors"
                        title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {n.isActive !== false && (
                        <button onClick={() => onDeactivate(n)}
                          className="p-1.5 rounded-control hover:bg-red-50 text-text-secondary hover:text-status-critical transition-colors"
                          title="Deactivate nurse">
                          <UserX className="w-4 h-4" />
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
