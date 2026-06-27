import React, { useEffect, useState, useCallback } from 'react';
import { Users, Cpu, Bell, Activity } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import RecentAlertsFeed from '../components/dashboard/RecentAlertsFeed';
import WardOverviewCard from '../components/dashboard/WardOverviewCard';
import { useSocket } from '../context/SocketContext';
import axiosInstance from '../api/axiosInstance';

export default function DashboardPage() {
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeDevices: 0,
    unresolvedAlerts: 0,
    activeSessions: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, alertsRes, wardsRes] = await Promise.all([
        axiosInstance.get('/reports/dashboard-stats'),
        axiosInstance.get('/alerts?limit=10&status=unresolved'),
        axiosInstance.get('/wards'),
      ]);
      setStats(statsRes.data);
      setRecentAlerts(alertsRes.data?.alerts || alertsRes.data || []);
      setWards(wardsRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!socket) return;
    const handleNewAlert = (alert) => {
      setRecentAlerts((prev) => [alert, ...prev].slice(0, 10));
      setStats((prev) => ({ ...prev, unresolvedAlerts: prev.unresolvedAlerts + 1 }));
    };
    const handleAlertResolved = () => {
      setStats((prev) => ({ ...prev, unresolvedAlerts: Math.max(0, prev.unresolvedAlerts - 1) }));
    };
    const handleReadingUpdate = () => {
      setStats((prev) => ({ ...prev, activeDevices: prev.activeDevices }));
    };
    socket.on('alert:new', handleNewAlert);
    socket.on('alert:resolved', handleAlertResolved);
    socket.on('reading:update', handleReadingUpdate);
    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:resolved', handleAlertResolved);
      socket.off('reading:update', handleReadingUpdate);
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
        <p className="text-text-secondary text-sm mt-1">Real-time overview of all wards and devices</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Patients"     value={stats.totalPatients}    icon={Users}    color="primary"  subtitle="Registered in system" />
        <StatCard title="Active Devices"     value={stats.activeDevices}    icon={Cpu}      color="ok"       subtitle="Currently online" />
        <StatCard title="Unresolved Alerts"  value={stats.unresolvedAlerts} icon={Bell}     color="critical" subtitle="Needs attention" />
        <StatCard title="Active Sessions"    value={stats.activeSessions}   icon={Activity} color="warn"     subtitle="IV drips running" />
      </div>

      {/* Ward Overview + Alerts Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ward Overview */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-display font-600 text-text-primary text-base">Ward Overview</h2>
          {wards.length === 0 ? (
            <div className="bg-white rounded-card border border-border p-8 text-center text-text-secondary text-sm">
              No wards configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wards.map((ward) => (
                <WardOverviewCard key={ward._id} ward={ward} />
              ))}
            </div>
          )}
        </div>

        {/* Alerts Feed */}
        <div className="xl:col-span-1 min-h-64">
          <RecentAlertsFeed alerts={recentAlerts} />
        </div>
      </div>
    </div>
  );
}
