import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, User, Droplets, Activity } from 'lucide-react';
import { getPatientByIdApi, endSessionApi } from '../api/patientApi';
import StartSessionModal from '../components/patients/StartSessionModal';
import DripRateChart from '../components/ward/DripRateChart';

const statusBadge = {
  normal:   'bg-green-50 text-status-ok',
  warning:  'bg-orange-50 text-status-warn',
  critical: 'bg-red-50 text-status-critical',
  offline:  'bg-slate-50 text-status-offline',
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const fetchPatient = async () => {
    try {
      const res = await getPatientByIdApi(id);
      setPatient(res.data);
    } catch (err) {
      console.error('Patient detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatient(); }, [id]);

  const handleEndSession = async () => {
    if (!patient?.activeSession) return;
    setEndingSession(true);
    try {
      await endSessionApi(patient._id, patient.activeSession._id, { reason: 'completed' });
      fetchPatient();
    } catch (err) {
      console.error('End session error:', err);
    } finally {
      setEndingSession(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!patient) return (
    <div className="text-center py-12 text-text-secondary">Patient not found.</div>
  );

  const status = patient.status || 'offline';

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/patients')}
          className="p-2 rounded-control hover:bg-surface-alt transition-colors mt-0.5">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-text-primary">{patient.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            {patient.ward} · Bed {patient.bedNumber} · Age {patient.age} · {patient.gender}
          </p>
        </div>
        <div className="flex gap-2">
          {patient.activeSession ? (
            <button onClick={handleEndSession} disabled={endingSession}
              className="flex items-center gap-2 px-4 py-2 rounded-control bg-status-critical text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
              <Square className="w-4 h-4" />
              {endingSession ? 'Ending...' : 'End Session'}
            </button>
          ) : (
            <button onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
              <Play className="w-4 h-4" />
              Start Session
            </button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patient Info */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-display font-600 text-text-primary text-sm">Patient Info</h3>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['Diagnosis', patient.diagnosis || '—'],
              ['Phone', patient.phone || '—'],
              ['Admitted', patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-text-secondary">{label}</dt>
                <dd className="text-text-primary font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live Reading */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-4 h-4 text-primary" />
            <h3 className="font-display font-600 text-text-primary text-sm">Live Reading</h3>
          </div>
          {patient.latestReading ? (
            <dl className="space-y-2 text-sm">
              {[
                ['Drip Rate', `${patient.latestReading.dropsPerMin} drops/min`],
                ['Volume Left', `${patient.latestReading.volumeMl} ml`],
                ['Battery', `${patient.latestReading.batteryPct}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="text-text-primary font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-text-secondary text-sm">No active reading.</p>
          )}
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-display font-600 text-text-primary text-sm">Active Session</h3>
          </div>
          {patient.activeSession ? (
            <dl className="space-y-2 text-sm">
              {[
                ['Prescribed Rate', `${patient.activeSession.prescribedRate} drops/min`],
                ['Total Volume', `${patient.activeSession.totalVolume} ml`],
                ['Fluid Type', patient.activeSession.fluidType || '—'],
                ['Started', new Date(patient.activeSession.startTime).toLocaleTimeString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="text-text-primary font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-text-secondary text-sm">No active session.</p>
          )}
        </div>
      </div>

      {/* Drip Rate Chart */}
      {patient.activeSession && (
        <div className="bg-white rounded-card border border-border shadow-sm p-5">
          <h3 className="font-display font-600 text-text-primary text-sm mb-2">30-Minute Drip Rate History</h3>
          <DripRateChart data={patient.chartData || []} />
        </div>
      )}

      {/* Session History */}
      <div className="bg-white rounded-card border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display font-600 text-text-primary text-sm">Session History</h3>
        </div>
        <div className="divide-y divide-border">
          {(patient.sessions || []).length === 0 ? (
            <p className="text-center py-8 text-text-secondary text-sm">No past sessions.</p>
          ) : (
            patient.sessions.map((s) => (
              <div key={s._id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="text-text-primary font-medium">{s.fluidType || 'IV Session'}</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(s.startTime).toLocaleDateString()} — {s.endTime ? new Date(s.endTime).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.endTime ? 'bg-green-50 text-status-ok' : 'bg-blue-50 text-primary'}`}>
                  {s.endTime ? 'Completed' : 'Active'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {showSessionModal && (
        <StartSessionModal
          patient={patient}
          onClose={() => setShowSessionModal(false)}
          onSuccess={fetchPatient}
        />
      )}
    </div>
  );
}
