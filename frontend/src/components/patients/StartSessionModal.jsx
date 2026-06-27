import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { startSessionApi } from '../../api/patientApi';
import axiosInstance from '../../api/axiosInstance';

export default function StartSessionModal({ patient, onClose, onSuccess }) {
  const [devices, setDevices] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [form, setForm] = useState({
    deviceId: '', nurseId: '',
    prescribedRate: '', totalVolume: '', fluidType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/devices?status=idle'),
      axiosInstance.get('/nurses'),
    ]).then(([devRes, nurseRes]) => {
      setDevices(devRes.data?.devices || devRes.data || []);
      setNurses(nurseRes.data?.nurses || nurseRes.data || []);
    }).catch(console.error);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deviceId || !form.prescribedRate || !form.totalVolume) {
      setError('Device, prescribed rate, and total volume are required.');
      return;
    }
    setLoading(true);
    try {
      await startSessionApi(patient._id, form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-display font-700 text-text-primary text-lg">Start IV Session</h3>
            <p className="text-xs text-text-secondary mt-0.5">{patient.name} · Bed {patient.bedNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-control hover:bg-surface-alt transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Assign Device *</label>
              <select name="deviceId" value={form.deviceId} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select idle device</option>
                {devices.map((d) => (
                  <option key={d._id} value={d._id}>{d.deviceId} — {d.location || 'Unassigned'}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Assign Nurse</label>
              <select name="nurseId" value={form.nurseId} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select nurse (optional)</option>
                {nurses.map((n) => (
                  <option key={n._id} value={n._id}>{n.name} — {n.ward}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Prescribed Rate (drops/min) *</label>
              <input name="prescribedRate" type="number" value={form.prescribedRate} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Total Volume (ml) *</label>
              <input name="totalVolume" type="number" value={form.totalVolume} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Fluid Type</label>
              <input name="fluidType" value={form.fluidType} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Normal Saline, Dextrose 5%" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
