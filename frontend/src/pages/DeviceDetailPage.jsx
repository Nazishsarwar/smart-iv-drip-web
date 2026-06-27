import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff, Battery, MapPin, Clock, User } from 'lucide-react';
import { getDeviceByIdApi, unassignDeviceApi } from '../api/deviceApi';
import { useSocket } from '../context/SocketContext';

const statusBadge = {
  online:  'bg-green-50 text-status-ok',
  idle:    'bg-blue-50 text-primary',
  offline: 'bg-slate-50 text-status-offline',
  error:   'bg-red-50 text-status-critical',
};

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState(false);

  const fetchDevice = async () => {
    try {
      const res = await getDeviceByIdApi(id);
      setDevice(res.data);
    } catch (err) {
      console.error('Device detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevice(); }, [id]);

  useEffect(() => {
    if (!socket || !device) return;
    const handleReading = (data) => {
      if (data.deviceId === device.deviceId) {
        setDevice((prev) => ({ ...prev, batteryPct: data.batteryPct, lastSeen: new Date(), status: 'online' }));
      }
    };
    const handleOffline = (data) => {
      if (data.deviceId === device.deviceId) setDevice((prev) => ({ ...prev, status: 'offline' }));
    };
    socket.on('reading:update', handleReading);
    socket.on('device:offline',  handleOffline);
    return () => {
      socket.off('reading:update', handleReading);
      socket.off('device:offline',  handleOffline);
    };
  }, [socket, device]);

  const handleUnassign = async () => {
    setUnassigning(true);
    try {
      await unassignDeviceApi(id);
      fetchDevice();
    } catch (err) {
      console.error('Unassign error:', err);
    } finally {
      setUnassigning(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!device) return (
    <div className="text-center py-12 text-text-secondary">Device not found.</div>
  );

  const status = device.status || 'offline';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/devices')}
          className="p-2 rounded-control hover:bg-surface-alt transition-colors mt-0.5">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-text-primary font-mono">{device.deviceId}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-1">{device.macAddress || 'No MAC address'} · {device.location || 'No location'}</p>
        </div>
        {device.assignedPatient && (
          <button onClick={handleUnassign} disabled={unassigning}
            className="px-4 py-2 rounded-control border border-status-critical text-status-critical text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60">
            {unassigning ? 'Unassigning...' : 'Unassign Device'}
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: status === 'online' ? Wifi : WifiOff, label: 'Connection', value: status, color: status === 'online' ? 'text-status-ok' : 'text-status-offline' },
          { icon: Battery, label: 'Battery', value: device.batteryPct != null ? `${device.batteryPct}%` : '—', color: (device.batteryPct || 0) < 20 ? 'text-status-critical' : 'text-status-ok' },
          { icon: MapPin, label: 'Location', value: device.location || '—', color: 'text-text-primary' },
          { icon: Clock, label: 'Last Seen', value: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : '—', color: 'text-text-primary' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-card border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className={`font-display font-600 text-base capitalize ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Assigned Patient */}
      <div className="bg-white rounded-card border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h3 className="font-display font-600 text-text-primary text-sm">Assigned Patient</h3>
        </div>
        {device.assignedPatient ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{device.assignedPatient.name}</p>
              <p className="text-sm text-text-secondary">{device.assignedPatient.ward} · Bed {device.assignedPatient.bedNumber}</p>
            </div>
            <button onClick={() => navigate(`/patients/${device.assignedPatient._id}`)}
              className="px-3 py-1.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
              View Patient
            </button>
          </div>
        ) : (
          <p className="text-text-secondary text-sm">No patient currently assigned.</p>
        )}
      </div>

      {/* Reading History */}
      <div className="bg-white rounded-card border border-border shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display font-600 text-text-primary text-sm">Recent Readings</h3>
        </div>
        <div className="divide-y divide-border">
          {(device.recentReadings || []).length === 0 ? (
            <p className="text-center py-8 text-text-secondary text-sm">No readings recorded yet.</p>
          ) : (
            device.recentReadings.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex gap-6">
                  <span className="text-text-secondary">Rate: <span className="text-text-primary font-medium tabular-nums">{r.dropsPerMin} drops/min</span></span>
                  <span className="text-text-secondary">Volume: <span className="text-text-primary font-medium tabular-nums">{r.volumeMl} ml</span></span>
                  <span className="text-text-secondary">Battery: <span className="text-text-primary font-medium tabular-nums">{r.batteryPct}%</span></span>
                </div>
                <span className="text-xs text-text-secondary">{new Date(r.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
