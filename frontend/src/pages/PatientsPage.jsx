import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import PatientTable from '../components/patients/PatientTable';
import AddPatientModal from '../components/patients/AddPatientModal';
import StartSessionModal from '../components/patients/StartSessionModal';
import { getPatientsApi } from '../api/patientApi';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sessionPatient, setSessionPatient] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await getPatientsApi({ search, status: statusFilter !== 'all' ? statusFilter : undefined });
      setPatients(res.data?.patients || res.data || []);
    } catch (err) {
      console.error('Patients fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchPatients, 300);
    return () => clearTimeout(delay);
  }, [fetchPatients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Patients</h1>
          <p className="text-text-secondary text-sm mt-1">Manage all registered patients</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-9 pr-4 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          {['all', 'normal', 'warning', 'critical', 'offline'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <PatientTable
          patients={patients}
          onStartSession={(p) => setSessionPatient(p)}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchPatients}
        />
      )}
      {sessionPatient && (
        <StartSessionModal
          patient={sessionPatient}
          onClose={() => setSessionPatient(null)}
          onSuccess={fetchPatients}
        />
      )}
    </div>
  );
}
