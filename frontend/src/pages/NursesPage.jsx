import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import NurseTable from '../components/nurses/NurseTable';
import { getNursesApi, createNurseApi, deactivateNurseApi } from '../api/nurseApi';

export default function NursesPage() {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', ward: '', shift: 'Morning', password: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchNurses = useCallback(async () => {
    try {
      const res = await getNursesApi({ search: search || undefined });
      const data = res.data;
      setNurses(Array.isArray(data) ? data : Array.isArray(data?.nurses) ? data.nurses : []);
    } catch (err) {
      console.error('Nurses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(fetchNurses, 300);
    return () => clearTimeout(delay);
  }, [fetchNurses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      setFormError('Name, phone, and password are required.');
      return;
    }
    setFormLoading(true);
    try {
      await createNurseApi(form);
      setShowAddModal(false);
      setForm({ name: '', phone: '', ward: '', shift: 'Morning', password: '' });
      fetchNurses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create nurse.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (nurse) => {
    if (!window.confirm(`Deactivate ${nurse.name}?`)) return;
    try {
      await deactivateNurseApi(nurse._id);
      fetchNurses();
    } catch (err) {
      console.error('Deactivate error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Nurses</h1>
          <p className="text-text-secondary text-sm mt-1">Manage nursing staff accounts</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          Add Nurse
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nurses..."
          className="w-full pl-9 pr-4 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <NurseTable nurses={nurses} onDeactivate={handleDeactivate} />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-700 text-text-primary text-lg">Add Nurse</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-control hover:bg-surface-alt text-text-secondary">✕</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">{formError}</p>
              )}
              {[
                { name: 'name',     label: 'Full Name *',  type: 'text',     placeholder: 'Nurse full name' },
                { name: 'phone',    label: 'Phone *',      type: 'text',     placeholder: '03XXXXXXXXX' },
                { name: 'ward',     label: 'Ward',         type: 'text',     placeholder: 'e.g. Ward 1' },
                { name: 'password', label: 'Password *',   type: 'password', placeholder: 'Min 6 characters' },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
                  <input name={name} type={type} value={form[name]}
                    onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Shift</label>
                <select name="shift" value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {['Morning', 'Evening', 'Night'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {formLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {formLoading ? 'Adding...' : 'Add Nurse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
