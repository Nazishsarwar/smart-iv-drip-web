import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Users } from 'lucide-react';
import NurseTable from '../components/nurses/NurseTable';
import {
  getNursesApi,
  createNurseApi,
  deactivateNurseApi,
  assignPatientsApi,
} from '../api/nurseApi';
import axiosInstance from '../api/axiosInstance';

export default function NursesPage() {
  const [nurses,      setNurses]      = useState([]);
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNurse,   setSelectedNurse]  = useState(null);
  const [selectedPatients,setSelectedPatients] = useState([]);
  const [form,        setForm]        = useState({
    name: '', phone: '', ward: '', shift: 'Morning', password: '',
  });
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');
  const [assignLoading,setAssignLoading]= useState(false);

  const fetchNurses = useCallback(async () => {
    try {
      const res  = await getNursesApi({ search: search || undefined });
      const data = res.data;
      setNurses(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.nurses)
          ? data.nurses
          : []
      );
    } catch (err) {
      console.error('Nurses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchPatients = useCallback(async () => {
    try {
      const res  = await axiosInstance.get('/patients');
      const data = res.data;
      setPatients(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.patients)
          ? data.patients
          : []
      );
    } catch (err) {
      console.error('Patients fetch error:', err);
    }
  }, []);

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
      setFormError('');
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

  const openAssignModal = (nurse) => {
    setSelectedNurse(nurse);
    setSelectedPatients(
      (nurse.assignedPatients || []).map((p) => p._id || p)
    );
    fetchPatients();
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedNurse) return;
    setAssignLoading(true);
    try {
      await assignPatientsApi(selectedNurse._id, selectedPatients);
      setShowAssignModal(false);
      setSelectedNurse(null);
      setSelectedPatients([]);
      fetchNurses();
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  const togglePatient = (patientId) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Nurses</h1>
          <p className="text-text-secondary text-sm mt-1">Manage nursing staff accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Nurse
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nurses..."
          className="w-full pl-9 pr-4 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <NurseTable
          nurses={nurses}
          onDeactivate={handleDeactivate}
          onAssign={openAssignModal}
        />
      )}

      {/* ── Add Nurse Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-700 text-text-primary text-lg">Add Nurse</h3>
              <button
                onClick={() => { setShowAddModal(false); setFormError(''); }}
                className="p-1.5 rounded-control hover:bg-surface-alt text-text-secondary"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">
                  {formError}
                </p>
              )}
              {[
                { name: 'name',     label: 'Full Name *',  type: 'text',     placeholder: 'Nurse full name' },
                { name: 'phone',    label: 'Phone *',      type: 'text',     placeholder: '03XXXXXXXXX' },
                { name: 'ward',     label: 'Ward',         type: 'text',     placeholder: 'e.g. Ward 1' },
                { name: 'password', label: 'Password *',   type: 'password', placeholder: 'Min 6 characters' },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
                  <input
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Shift</label>
                <select
                  name="shift"
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {['Morning', 'Evening', 'Night'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {formLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {formLoading ? 'Adding...' : 'Add Nurse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Patients Modal ── */}
      {showAssignModal && selectedNurse && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-display font-700 text-text-primary text-lg">
                  Assign Patients
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Assigning to: {selectedNurse.name}
                </p>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedNurse(null); }}
                className="p-1.5 rounded-control hover:bg-surface-alt text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-center text-text-secondary text-sm py-6">
                  No patients found. Add patients first.
                </p>
              ) : (
                <div className="space-y-2">
                  {patients.map((p) => {
                    const isSelected = selectedPatients.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        onClick={() => togglePatient(p._id)}
                        className={`flex items-center gap-3 p-3 rounded-control border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-blue-50'
                            : 'border-border hover:bg-surface-alt'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-secondary">
                            {p.ward} · Bed {p.bedNumber}
                            {p.diagnosis ? ` · ${p.diagnosis}` : ''}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          p.status === 'critical' ? 'bg-red-50 text-status-critical' :
                          p.status === 'warning'  ? 'bg-orange-50 text-status-warn' :
                          p.status === 'normal'   ? 'bg-green-50 text-status-ok' :
                          'bg-slate-50 text-status-offline'
                        }`}>
                          {p.status || 'inactive'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-secondary">
                {selectedPatients.length} patient{selectedPatients.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedNurse(null); }}
                  className="px-4 py-2 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assignLoading}
                  className="px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {assignLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {assignLoading ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
