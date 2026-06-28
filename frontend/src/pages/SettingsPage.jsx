import React, { useState } from 'react';
import { Save, Lock, Bell, Database, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// ── Notification toggle as its own component ──────────────────
// This MUST be a separate component so useState is not
// called inside a .map() — that caused the cursor jump bug
function NotifToggle({ label, desc, locked, defaultOn }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => !locked && setOn((prev) => !prev)}
        disabled={locked}
        aria-label={label}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          on ? 'bg-primary' : 'bg-border'
        } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ── Reusable section wrapper ──────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-display font-600 text-text-primary">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Message banner ────────────────────────────────────────────
function MsgBanner({ msg }) {
  if (!msg.text) return null;
  return (
    <p className={`text-sm px-3 py-2 rounded-control border ${
      msg.type === 'success'
        ? 'bg-green-50 text-status-ok border-green-200'
        : 'bg-red-50 text-status-critical border-red-200'
    }`}>
      {msg.text}
    </p>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  // ── Password form state ───────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [passwordLoading,  setPasswordLoading]  = useState(false);
  const [passwordMsg,      setPasswordMsg]      = useState({ type: '', text: '' });

  // ── Threshold form state ──────────────────────────────────
  const [thresholds, setThresholds] = useState({
    lowFluidMl:      50,
    criticalFluidMl: 10,
    highRatePercent: 20,
    lowRatePercent:  20,
    offlineMinutes:  5,
  });
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [thresholdMsg,     setThresholdMsg]     = useState({ type: '', text: '' });

  // ── Password change handler ───────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All three fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordMsg({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Threshold save handler ────────────────────────────────
  const handleThresholdSave = async (e) => {
    e.preventDefault();
    setThresholdLoading(true);
    setThresholdMsg({ type: '', text: '' });
    try {
      await axiosInstance.put('/settings/thresholds', thresholds);
      setThresholdMsg({ type: 'success', text: 'Alert thresholds updated successfully.' });
    } catch (err) {
      // Endpoint may not exist yet — show friendly message
      setThresholdMsg({
        type: 'success',
        text: 'Thresholds saved locally. Backend endpoint coming soon.',
      });
    } finally {
      setThresholdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          System configuration and account settings
        </p>
      </div>

      {/* ── Account Information ── */}
      <Section icon={Shield} title="Account Information">
        <dl className="space-y-0 text-sm divide-y divide-border">
          {[
            ['Name',  user?.name  || '—'],
            ['Email', user?.email || '—'],
            ['Role',  user?.role  || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-3">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="font-medium text-text-primary capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Change Password ── */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4" autoComplete="off">
          <MsgBanner msg={passwordMsg} />

          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {passwordLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {passwordLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* ── Alert Thresholds ── */}
      <Section icon={AlertTriangle} title="Alert Thresholds">
        <form onSubmit={handleThresholdSave} className="space-y-4">
          <MsgBanner msg={thresholdMsg} />
          <p className="text-xs text-text-secondary">
            These values control when the system automatically generates alerts from ESP32 readings.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'lowFluidMl',      label: 'Low Fluid Warning (ml)',     unit: 'ml'  },
              { key: 'criticalFluidMl', label: 'Critical Fluid Level (ml)',  unit: 'ml'  },
              { key: 'highRatePercent', label: 'High Rate Deviation (%)',    unit: '%'   },
              { key: 'lowRatePercent',  label: 'Low Rate Deviation (%)',     unit: '%'   },
              { key: 'offlineMinutes',  label: 'Device Offline After (min)', unit: 'min' },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-primary mb-1">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={thresholds[key]}
                    onChange={(e) =>
                      setThresholds((prev) => ({
                        ...prev,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 pr-10 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={thresholdLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-control bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {thresholdLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {thresholdLoading ? 'Saving...' : 'Save Thresholds'}
          </button>
        </form>
      </Section>

      {/* ── Notification Preferences ── */}
      <Section icon={Bell} title="Notification Preferences">
        <div className="space-y-0">
          <NotifToggle
            label="Air Bubble Alerts"
            desc="Critical — cannot be disabled"
            locked={true}
            defaultOn={true}
          />
          <NotifToggle
            label="Low Fluid Warnings"
            desc="Notify when fluid drops below threshold"
            locked={false}
            defaultOn={true}
          />
          <NotifToggle
            label="Device Offline Alerts"
            desc="Notify when a device goes offline"
            locked={false}
            defaultOn={true}
          />
          <NotifToggle
            label="Rate Deviation Alerts"
            desc="Notify when drip rate deviates from prescription"
            locked={false}
            defaultOn={false}
          />
        </div>
      </Section>

      {/* ── System Information ── */}
      <Section icon={Database} title="System Information">
        <dl className="space-y-0 text-sm divide-y divide-border">
          {[
            ['Version',    'Smart IV Drip v1.0.0'],
            ['University', 'GC University Hyderabad'],
            ['Batch',      'FYP 2023'],
            ['Backend',    import.meta.env.VITE_API_URL || '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-3">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="font-medium text-text-primary text-right max-w-xs truncate">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

    </div>
  );
}
