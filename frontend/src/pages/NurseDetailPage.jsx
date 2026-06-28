import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, MapPin,
  Clock, Users, CheckCircle, AlertTriangle
} from 'lucide-react';
import { getNurseByIdApi } from '../api/nurseApi';

const shiftColor = {
  Morning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Evening: 'bg-orange-50 text-status-warn border-orange-200',
  Night:   'bg-blue-50 text-primary border-blue-200',
};

const patientStatusColor = {
  normal:   'bg-green-50 text-status-ok',
  warning:  'bg-orange-50 text-status-warn',
  critical: 'bg-red-50 text-status-critical',
  inactive: 'bg-slate-50 text-status-offline',
  active:   'bg-blue-50 text-primary',
};

export default function NurseDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [nurse,   setNurse]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getNurseByIdApi(id)
      .then((res) => {
        // Backend now returns { success, nurse: { ...data } }
        const data = res.data?.nurse || res.data;
        setNurse(data);
      })
      .catch((err) => {
        console.error('Nurse detail error:', err);
        setError('Failed to load nurse details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-status-critical">{error}</div>
  );

  if (!nurse) return (
    <div className="text-center py-12 text-text-secondary">Nurse not found.</div>
  );

  const assignedPatients = Array.isArray(nurse.assignedPatients)
    ? nurse.assignedPatients
    : [];

  const alertHistory = Array.isArray(nurse.alertHistory)
    ? nurse.alertHistory
    : [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/nurses')}
          className="p-2 rounded-control hover:bg-surface-alt transition-colors mt-0.5"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {nurse.name}
            </h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              shiftColor[nurse.shift] || 'bg-slate-50 text-text-secondary border-slate-200'
            }`}>
              {nurse.shift || '—'} Shift
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              nurse.isActive !== false
                ? 'bg-green-50 text-status-ok'
                : 'bg-slate-50 text-status-offline'
            }`}>
              {nurse.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            {nurse.ward || 'No ward assigned'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Patients Assigned',
            value: assignedPatients.length,
            icon:  Users,
            color: 'text-primary',
          },
          {
            label: 'Alerts Resolved',
            value: nurse.totalResolved || 0,
            icon:  CheckCircle,
            color: 'text-status-ok',
          },
          {
            label: 'Alerts Acknowledged',
            value: nurse.totalAcknowledged || 0,
            icon:  AlertTriangle,
            color: 'text-status-warn',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-card border border-border shadow-sm p-4 flex items-center gap-4"
          >
            <div className="bg-surface-alt rounded-control p-3">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-text-primary tabular-nums">
                {value}
              </p>
              <p className="text-xs text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Nurse Information */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <h3 className="font-display font-600 text-text-primary text-sm mb-4">
            Nurse Information
          </h3>
          <dl className="space-y-0 divide-y divide-border">
            {[
              { icon: User,   label: 'Full Name', value: nurse.name  || '—' },
              { icon: Phone,  label: 'Phone',     value: nurse.phone || '—' },
              { icon: MapPin, label: 'Ward',      value: nurse.ward  || '—' },
              { icon: Clock,  label: 'Shift',     value: nurse.shift || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3">
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
              Assigned Patients ({assignedPatients.length})
            </h3>
          </div>

          {assignedPatients.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No patients assigned.</p>
              <p className="text-xs text-text-secondary mt-1">
                Use POST /api/nurses/:id/assign-patients to assign.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedPatients.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/patients/${p._id}`)}
                  className="flex items-center justify-between p-3 rounded-control border border-border hover:bg-surface-alt cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-secondary">
                      {p.ward || '—'} · Bed {p.bedNumber || '—'}
                    </p>
                    {p.diagnosis && (
                      <p className="text-xs text-text-secondary italic">{p.diagnosis}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                    patientStatusColor[p.status] || patientStatusColor.inactive
                  }`}>
                    {p.status || 'inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Alert Response History */}
      <div className="bg-white rounded-card border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-600 text-text-primary text-sm">
            Recent Alert Responses
          </h3>
          <span className="text-xs text-text-secondary">
            {alertHistory.length} resolved
          </span>
        </div>

        <div className="divide-y divide-border">
          {alertHistory.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No alert responses recorded yet.</p>
              <p className="text-xs text-text-secondary mt-1">
                Alerts resolved by this nurse will appear here.
              </p>
            </div>
          ) : (
            alertHistory.map((a) => (
              <div
                key={a._id}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="text-text-primary font-medium capitalize">
                    {a.type?.replace(/_/g, ' ') || 'Alert'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {a.patientName || '—'} · {a.ward || '—'}
                  </p>
                  {a.resolutionNote && (
                    <p className="text-xs text-text-secondary mt-0.5 italic">
                      "{a.resolutionNote}"
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-text-secondary">
                    {new Date(a.resolvedAt || a.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(a.resolvedAt || a.createdAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <span className="text-xs text-status-ok font-medium">Resolved</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
