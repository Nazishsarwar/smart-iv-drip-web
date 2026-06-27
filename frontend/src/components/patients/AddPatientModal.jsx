import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPatientApi } from '../../api/patientApi';

export default function AddPatientModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male',
    ward: '', bedNumber: '', diagnosis: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.ward || !form.bedNumber) {
      setError('Name, ward, and bed number are required.');
      return;
    }
    setLoading(true);
    try {
      await createPatientApi(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display font-700 text-text-primary text-lg">Add New Patient</h3>
          <button onClick={onClose} className="p-1.5 rounded-control hover:bg-surface-alt transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Patient full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Age" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Ward *</label>
              <input name="ward" value={form.ward} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Ward 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Bed Number *</label>
              <input name="bedNumber" value={form.bedNumber} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. B-12" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Diagnosis</label>
              <input name="diagnosis" value={form.diagnosis} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Primary diagnosis" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Contact Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="03XXXXXXXXX" />
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
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
