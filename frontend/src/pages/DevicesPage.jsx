import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import DeviceTable from '../components/devices/DeviceTable';
import { getDevicesApi, registerDeviceApi } from '../api/deviceApi';
import { useSocket } from '../context/SocketContext';

export default function DevicesPage() {
  const { socket } = useSocket();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ deviceId: '', macAddress: '', location: '' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const fetchDevices = useCallback(async () => {
    try {
      const res = await getDevicesApi({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const data = res.data;
      setDevices(Array.isArray(data) ? data : Array.isArray(data?.devices) ? data.devices : []);
    } catch (err) {
      console.error('Devices fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchDevices, 300);
    return () => clearTimeout(delay);
  }, [fetchDevices]);

  useEffect(() => {
    if (!socket) return;
    const handleOnline  = () => fetchDevices();
    const handleOffline = () => fetchDevices();
    socket.on('device:online',  handleOnline);
    socket.on('device:offline', handleOffline);
    return () => {
      socket.off('device:online',  handleOnline);
      socket.off('device:offline', handleOffline);
    };
  }, [socket, fetchDevices]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.deviceId) { setRegisterError('Device ID is required.'); return; }
    setRegisterLoading(true);
    try {
      await registerDeviceApi(registerForm);
      setShowRegisterModal(false);
      setRegisterForm({ deviceId: '', macAddress: '', location: '' });
      fetchDevices();
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Failed to register device.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Devices</h1>
          <p className="text-text-secondary text-sm mt-1">Manage all registered ESP32 devices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
            <Plus className="w-4 h-4" />
            Register Device
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices..."
            className="w-full pl-9 pr-4 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'online', 'idle', 'offline', 'error'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
              }`}>
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
        <DeviceTable devices={devices} onRefresh={fetchDevices} />
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display font-700 text-text-primary text-lg">Register New Device</h3>
              <button onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-control hover:bg-surface-alt transition-colors text-text-secondary">✕</button>
            </div>
            <form onSubmit={handleRegister} className="px-6 py-5 space-y-4">
              {registerError && (
                <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">{registerError}</p>
              )}
              {[
                { name: 'deviceId',   label: 'Device ID *',    placeholder: 'e.g. ESP32-001' },
                { name: 'macAddress', label: 'MAC Address',     placeholder: 'e.g. AA:BB:CC:DD:EE:FF' },
                { name: 'location',   label: 'Location / Ward', placeholder: 'e.g. Ward 1' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
                  <input name={name} value={registerForm[name]}
                    onChange={(e) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={registerLoading}
                  className="flex-1 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {registerLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {registerLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
