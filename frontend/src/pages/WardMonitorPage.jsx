import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import PatientDripCard from '../components/ward/PatientDripCard';
import { useSocket } from '../context/SocketContext';
import axiosInstance from '../api/axiosInstance';

export default function WardMonitorPage() {
  const { socket } = useSocket();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/patients?hasActiveSession=true');
      const raw = res.data?.patients || res.data || [];

      // Normalize each patient so latestReading and chartData
      // are always present even if backend returns them empty
      const normalized = raw.map((p) => ({
        ...p,
        // activeDevice is the string deviceId e.g. "ESP32-001"
        activeDevice:  p.activeDevice  || p.activeSession?.device?.deviceId || null,
        latestReading: p.latestReading || null,
        chartData:     Array.isArray(p.chartData) ? p.chartData : [],
      }));

      setPatients(normalized);
    } catch (err) {
      console.error('Ward monitor fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // ── Socket.IO live reading updates ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleReading = (data) => {
      setPatients((prev) =>
        prev.map((p) => {
          // Match using the string deviceId stored in activeDevice
          const match =
            p.activeDevice === data.deviceId ||
            p.activeSession?.device?.deviceId === data.deviceId;

          if (!match) return p;

          const volumeMl = data.volumeMl ?? p.latestReading?.volumeMl ?? 999;
          const newStatus =
            volumeMl < 10  ? 'critical' :
            volumeMl < 50  ? 'warning'  : 'normal';

          const newPoint = {
            time: new Date().toLocaleTimeString([], {
              hour:   '2-digit',
              minute: '2-digit',
            }),
            dropsPerMin: data.dropsPerMin,
          };

          return {
            ...p,
            status: newStatus,
            latestReading: {
              dropsPerMin: data.dropsPerMin,
              volumeMl:    data.volumeMl,
              batteryPct:  data.batteryPct,
            },
            chartData: [...(p.chartData || []).slice(-29), newPoint],
          };
        })
      );
    };

    socket.on('reading:update', handleReading);
    return () => socket.off('reading:update', handleReading);
  }, [socket]);

  const filters = ['all', 'critical', 'warning', 'normal', 'offline'];

  const filtered = patients
    .filter((p) => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, normal: 2, offline: 3, inactive: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Live Ward Monitor
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time IV drip status for all active patients
          </p>
        </div>
        <button
          onClick={fetchPatients}
          className="flex items-center gap-2 px-4 py-2 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Patient Count */}
      {!loading && (
        <p className="text-xs text-text-secondary">
          Showing {filtered.length} of {patients.length} active patient{patients.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-card border border-border p-12 text-center">
          <p className="text-text-secondary text-sm">
            {patients.length === 0
              ? 'No active IV sessions running. Start a session from the Patients page.'
              : `No patients with "${filter}" status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filtered.map((patient) => (
            <PatientDripCard key={patient._id} patient={patient} />
          ))}
        </div>
      )}

    </div>
  );
}
