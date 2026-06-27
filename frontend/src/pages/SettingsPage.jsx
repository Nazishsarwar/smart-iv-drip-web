import React, { useState } from 'react';
import { Save, Lock, Bell, Database, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

export default function SettingsPage() {
  const { user } = useAuth();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [thresholds, setThresholds] = useState({
    lowFluidMl: 50,
    criticalFluidMl: 10,
    highRatePercent: 20,
    lowRatePercent: 20,
    offlineMinutes: 5,
  });
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleThresholdSave = async (e) => {
    e.preventDefault();
    setThresholdLoading(true);
    try {
      await axiosInstance.put('/settings/thresholds', thresholds);
      setThresholdMsg({ type: 'success', text: 'Alert thresholds updated successfully.' });
    } catch (err) {
      setThresholdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save thresholds.' });
    } finally {
      setThresholdLoading(false);
    }
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-card border border-border shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-display font-600 text-text-primary">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );

  const MsgBanner = ({ msg }) => msg.text ? (
    <p className={`text-sm px-3 py-2 rounded-control border ${
      msg.type === 'success'
        ? 'bg-green-50 text-status-ok border-green-200'
        : 'bg-red-50 text-status-critical border-red-200'
    }`}>{msg.text}</p>
  ) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">System configuration and account settings</p>
      </div>

      {/* Account Info */}
      <Section icon={Shield} title="Account Information">
        <dl className="space-y-3 text-sm">
          {[
            ['Name',  user?.name  || '—'],
            ['Email', user?.email || '—'],
            ['Role',  user?.role  || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="font-medium text-text-primary capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Change Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <MsgBanner msg={passwordMsg} />
          {[
            { name: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { name: 'newPassword',     label: 'New Password',     placeholder: 'Min 6 characters' },
            { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat new password' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
              <input type="password" name={name} value={passwordForm[name]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
          <button type="submit" disabled={passwordLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
            {passwordLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <Save className="w-4 h-4" />
            {passwordLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* Alert Thresholds */}
      <Section icon={AlertTriangle} title="Alert Thresholds">
        <form onSubmit={handleThresholdSave} className="space-y-4">
          <MsgBanner msg={thresholdMsg} />
          <p className="text-xs text-text-secondary">
            These values control when the system automatically generates alerts from ESP32 readings.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'lowFluidMl',      label: 'Low Fluid Warning (ml)',    unit: 'ml' },
              { name: 'criticalFluidMl', label: 'Critical Fluid Level (ml)', unit: 'ml' },
              { name: 'highRatePercent', label: 'High Rate Deviation (%)',   unit: '%' },
              { name: 'lowRatePercent',  label: 'Low Rate Deviation (%)',    unit: '%' },
              { name: 'offlineMinutes',  label: 'Device Offline After (min)', unit: 'min' },
            ].map(({ name, label, unit }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-text-primary mb-1">{label}</label>
                <div className="relative">
                  <input type="number" value={thresholds[name]}
                    onChange={(e) => setThresholds({ ...thresholds, [name]: Number(e.target.value) })}
                    className="w-full px-3 py-2 pr-10 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <button type="submit" disabled={thresholdLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
            {thresholdLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <Save className="w-4 h-4" />
            {thresholdLoading ? 'Saving...' : 'Save Thresholds'}
          </button>
        </form>
      </Section>

      {/* Notification Preferences */}
      <Section icon={Bell} title="Notification Preferences">
        <div className="space-y-3">
          {[
            { label: 'Air Bubble Alerts',    desc: 'Critical — cannot be disabled', locked: true,  defaultOn: true },
            { label: 'Low Fluid Warnings',   desc: 'Notify when fluid drops below threshold', locked: false, defaultOn: true },
            { label: 'Device Offline Alerts',desc: 'Notify when a device goes offline',        locked: false, defaultOn: true },
            { label: 'Rate Deviation Alerts',desc: 'Notify when drip rate deviates from prescription', locked: false, defaultOn: false },
          ].map(({ label, desc, locked, defaultOn }) => {
            const [on, setOn] = useState(defaultOn);
            return (
              <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => !locked && setOn(!on)}
                  disabled={locked}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    on ? 'bg-primary' : 'bg-border'
                  } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* System Info */}
      <Section icon={Database} title="System Information">
        <dl className="space-y-2 text-sm">
          {[
            ['Version',   'Smart IV Drip v1.0.0'],
            ['University','GC University Hyderabad'],
            ['Batch',     'FYP 2023'],
            ['Backend',   import.meta.env.VITE_API_URL || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="font-medium text-text-primary text-right max-w-xs truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}
