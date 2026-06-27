import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axiosInstance from '../api/axiosInstance';

const TABS = ['Overview', 'Device Performance', 'Nurse Performance', 'Patient Therapy'];

const COLORS = ['#2B6CB0', '#16A34A', '#EA8C00', '#DC2626', '#0D9488', '#94A3B8'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from: dateRange.from || undefined,
        to:   dateRange.to   || undefined,
      };
      const res = await axiosInstance.get('/reports', { params });
      setData(res.data || {});
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const chartCard = (title, children) => (
    <div className="bg-white rounded-card border border-border shadow-sm p-5">
      <h4 className="font-display font-600 text-text-primary text-sm mb-4">{title}</h4>
      {children}
    </div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartCard('Daily Alert Volume', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.dailyAlerts || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="count" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Alert Types Distribution', (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data.alertTypes || []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
              {(data.alertTypes || []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Sessions Per Day', (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.dailySessions || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Line type="monotone" dataKey="count" stroke="#0D9488" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Summary Stats', (
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { label: 'Total Sessions',    value: data.totalSessions    || 0 },
            { label: 'Total Alerts',      value: data.totalAlerts      || 0 },
            { label: 'Avg Response Time', value: data.avgResponseTime  ? `${data.avgResponseTime}m` : '—' },
            { label: 'Resolution Rate',   value: data.resolutionRate   ? `${data.resolutionRate}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-alt rounded-control p-3 text-center">
              <p className="font-display font-bold text-2xl text-text-primary tabular-nums">{value}</p>
              <p className="text-xs text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderDevicePerformance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartCard('Device Uptime (%)', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.deviceUptime || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis dataKey="deviceId" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={80} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="uptime" fill="#16A34A" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Readings Per Device', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.deviceReadings || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="deviceId" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="count" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
    </div>
  );

  const renderNursePerformance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartCard('Alerts Resolved Per Nurse', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.nurseAlerts || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={100} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="resolved" fill="#0D9488" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Avg Response Time Per Nurse (min)', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.nurseResponseTimes || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="avgTime" fill="#EA8C00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
    </div>
  );

  const renderPatientTherapy = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartCard('Sessions Per Patient', (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.patientSessions || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Bar dataKey="sessions" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ))}
      {chartCard('Fluid Types Used', (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data.fluidTypes || []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80}
              label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
              {(data.fluidTypes || []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      ))}
    </div>
  );

  const tabContent = {
    'Overview':           renderOverview,
    'Device Performance': renderDevicePerformance,
    'Nurse Performance':  renderNursePerformance,
    'Patient Therapy':    renderPatientTherapy,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-secondary text-sm mt-1">Analytics and performance insights</p>
      </div>

      {/* Date Range — sticky across tabs */}
      <div className="bg-white rounded-card border border-border shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-text-primary">Date Range:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-1.5 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <span className="text-text-secondary text-sm">to</span>
          <input type="date" value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-1.5 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button onClick={fetchReports}
          className="px-4 py-1.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
          Apply
        </button>
        <button onClick={() => setDateRange({ from: '', to: '' })}
          className="px-4 py-1.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors">
          Clear
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-card border border-border shadow-sm p-1 w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-control text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        tabContent[activeTab]?.()
      )}
    </div>
  );
}
