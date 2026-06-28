import React, { useEffect, useState, useCallback } from 'react';
import { Users, Cpu, Bell, Activity } from 'lucide-react';
import StatCard          from '../components/dashboard/StatCard';
import RecentAlertsFeed  from '../components/dashboard/RecentAlertsFeed';
import WardOverviewCard  from '../components/dashboard/WardOverviewCard';
import { useSocket }     from '../context/SocketContext';
import axiosInstance     from '../api/axiosInstance';

export default function DashboardPage() {
  const { socket } = useSocket();

  const [stats, setStats] = useState({
    totalPatients:    0,
    activeDevices:    0,
    unresolvedAlerts: 0,
    activeSessions:   0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [wards,        setWards]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Fetch all dashboard data ──────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, alertsRes, wardsRes] = await Promise.all([
        axiosInstance.get('/reports/dashboard-stats'),
        axiosInstance.get('/alerts?limit=10'),
        axiosInstance.get('/wards').catch(() => ({ data: [] })),
      ]);

      // Stats
      setStats({
        totalPatients:    statsRes.data?.totalPatients    ?? 0,
        activeDevices:    statsRes.data?.activeDevices    ?? 0,
        unresolvedAlerts: statsRes.data?.unresolvedAlerts ?? 0,
        activeSessions:   statsRes.data?.activeSessions   ?? 0,
      });

      // Alerts — normalize response shape
      const alertsData = alertsRes.data;
      const alertsList = Array.isArray(alertsData)
        ? alertsData
        : Array.isArray(alertsData?.alerts)
        ? alertsData.alerts
        : [];
      setRecentAlerts(alertsList.slice(0, 10));

      // Wards — normalize response shape
      const wardsData = wardsRes.data;
      setWards(
        Array.isArray(wardsData)
          ? wardsData
          : Array.isArray(wardsData?.wards)
          ? wardsData.wards
          : []
      );
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setWards([]);
      setRecentAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Socket.IO live event handlers ─────────────────────────
  useEffect(() => {
    if (!socket) return;

    // New alert arrives — add to top of feed + increment counter
    const handleNewAlert = (data) => {
      // Socket may send the alert directly or wrapped in { alert: ... }
      const alert = data?.alert || data;

      if (!alert?._id && !alert?.type) return; // ignore malformed events

      setRecentAlerts((prev) => {
        // Avoid duplicates
        const exists = prev.some((a) => a._id === alert._id);
        if (exists) return prev;
        return [alert, ...prev].slice(0, 10);
      });

      setStats((prev) => ({
        ...prev,
        unresolvedAlerts: prev.unresolvedAlerts + 1,
      }));
    };

    // Alert resolved — decrement counter + refresh feed
    const handleAlertResolved = () => {
      setStats((prev) => ({
        ...prev,
        unresolvedAlerts: Math.max(0, prev.unresolvedAlerts - 1),
      }));
      // Refresh feed so resolved status shows correctly
      axiosInstance.get('/alerts?limit=10').then((res) => {
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.alerts)
          ? data.alerts
          : [];
        setRecentAlerts(list.slice(0, 10));
      }).catch(() => {});
    };

    // Alert acknowledged — refresh feed to show updated status
    const handleAlertAcknowledged = () => {
      axiosInstance.get('/alerts?limit=10').then((res) => {
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.alerts)
          ? data.alerts
          : [];
        setRecentAlerts(list.slice(0, 10));
      }).catch(() => {});
    };

    // Reading update — update active devices count
    const handleReadingUpdate = () => {
      axiosInstance.get('/reports/dashboard-stats').then((res) => {
        setStats({
          totalPatients:    res.data?.totalPatients    ?? 0,
          activeDevices:    res.data?.activeDevices    ?? 0,
          unresolvedAlerts: res.data?.unresolvedAlerts ?? 0,
          activeSessions:   res.data?.activeSessions   ?? 0,
        });
      }).catch(() => {});
    };

    socket.on('alert:new',          handleNewAlert);
    socket.on('alert:resolved',     handleAlertResolved);
    socket.on('alert:acknowledged', handleAlertAcknowledged);
    socket.on('reading:update',     handleReadingUpdate);

    return () => {
      socket.off('alert:new',          handleNewAlert);
      socket.off('alert:resolved',     handleAlertResolved);
      socket.off('alert:acknowledged', handleAlertAcknowledged);
      socket.off('reading:update',     handleReadingUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Real-time overview of all wards and devices
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="primary"
          subtitle="Registered in system"
        />
        <StatCard
          title="Active Devices"
          value={stats.activeDevices}
          icon={Cpu}
          color="ok"
          subtitle="Currently online"
        />
        <StatCard
          title="Unresolved Alerts"
          value={stats.unresolvedAlerts}
          icon={Bell}
          color="critical"
          subtitle="Needs attention"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Activity}
          color="warn"
          subtitle="IV drips running"
        />
      </div>

      {/* Ward Overview + Alerts Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Ward Overview */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-display font-600 text-text-primary text-base">Ward Overview</h2>
          {wards.length === 0 ? (
            <div className="bg-white rounded-card border border-border p-8 text-center text-text-secondary text-sm">
              No wards configured yet. Create wards via Postman or the API.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wards.map((ward) => (
                <WardOverviewCard key={ward._id} ward={ward} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts Feed */}
        <div className="xl:col-span-1 min-h-64">
          <RecentAlertsFeed alerts={recentAlerts} />
        </div>

      </div>
    </div>
  );
}
