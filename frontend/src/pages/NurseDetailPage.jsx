import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Clock, Users } from 'lucide-react';
import { getNurseByIdApi } from '../api/nurseApi';

export default function NurseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNurseByIdApi(id)
      .then((res) => setNurse(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!nurse) return <div className="text-center py-12 text-text-secondary">Nurse not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/nurses')}
          className="p-2 rounded-control hover:bg-surface-alt transition-colors mt-0.5">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">{nurse.name}</h1>
          <p className="text-text-secondary text-sm mt-1">{nurse.ward} · {nurse.shift} Shift</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <h3 className="font-display font-600 text-text-primary text-sm mb-4">Nurse Information</h3>
          <dl className="space-y-3">
            {[
              { icon: User,   label: 'Full Name', value: nurse.name },
              { icon: Phone,  label: 'Phone',     value: nurse.phone || '—' },
              { icon: MapPin, label: 'Ward',      value: nurse.ward || '—' },
              { icon: Clock,  label: 'Shift',     value: nurse.shift || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <div className="flex justify-between flex-1">
                  <dt className="text-sm text-text-secondary">{label}</dt>
                  <dd className="text-sm font-medium text-text-primary">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Assigned Patients */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-display font-600 text-text-primary text-sm">
              Assigned Patients ({nurse.assignedPatients?.length || 0})
            </h3>
          </div>
          {(nurse.assignedPatients || []).length === 0 ? (
            <p className="text-text-secondary text-sm">No patients assigned.</p>
          ) : (
            <div className="space-y-2">
              {nurse.assignedPatients.map((p) => (
                <div key={p._id}
                  onClick={() => navigate(`/patients/${p._id}`)}
                  className="flex items-center justify-between p-3 rounded-control border border-border hover:bg-surface-alt cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary">{p.ward} · Bed {p.bedNumber}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'critical' ? 'bg-red-50 text-status-critical' :
                    p.status === 'warning'  ? 'bg-orange-50 text-status-warn' :
                    'bg-green-50 text-status-ok'
                  }`}>{p.status || 'normal'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-card border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display font-600 text-text-primary text-sm">Recent Alert Responses</h3>
        </div>
        <div className="divide-y divide-border">
          {(nurse.alertHistory || []).length === 0 ? (
            <p className="text-center py-8 text-text-secondary text-sm">No alert responses recorded.</p>
          ) : (
            nurse.alertHistory.map((a) => (
              <div key={a._id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="text-text-primary font-medium capitalize">{a.type?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-text-secondary">{a.patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">{new Date(a.resolvedAt || a.createdAt).toLocaleString()}</p>
                  <span className="text-xs text-status-ok">Resolved</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
