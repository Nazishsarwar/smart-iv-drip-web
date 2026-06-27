import React, { useState } from 'react';
import { X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { resolveAlertApi } from '../../api/alertApi';

const guidanceMap = {
  air_bubble:     'Immediately pause the IV drip. Check the drip chamber and tubing for air. Purge air from the line before restarting. Notify the attending physician.',
  low_fluid:      'The IV bag is running low. Prepare a replacement bag. Replace before the bag empties completely to avoid air entry.',
  drip_stopped:   'The drip has stopped unexpectedly. Check for kinked tubing, closed clamp, or dislodged needle. Restart or escalate if unable to resolve.',
  high_rate:      'Drip rate is above the prescribed threshold. Check the flow regulator. Reduce rate to prescribed level immediately.',
  low_rate:       'Drip rate is below the prescribed threshold. Check for partial blockage or kinked tubing. Adjust to prescribed rate.',
  device_offline: 'The ESP32 monitoring device has gone offline. Check device power and WiFi connection. Manual monitoring required until device reconnects.',
  manual:         'Manually created alert. Follow standard hospital protocol for this alert type.',
};

const severityHeaderColor = {
  critical: 'bg-status-critical',
  warning:  'bg-status-warn',
  info:     'bg-primary',
};

const statusLabel = {
  active:       'Unresolved',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

export default function AlertDetailModal({ alert, onClose, onResolved }) {
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveAlertApi(alert._id, { resolutionNote: note });
      onResolved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve alert.');
    } finally {
      setResolving(false);
    }
  };

  const headerColor = severityHeaderColor[alert.severity] || 'bg-primary';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg">

        {/* Colored header */}
        <div className={`${headerColor} px-6 py-4 rounded-t-card flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-display font-700 text-white text-lg capitalize">
                {alert.type?.replace(/_/g, ' ')}
              </h3>
              <p className="text-white/80 text-xs">
                {alert.patientName || '—'} · {alert.ward || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-control hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-alt rounded-control p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs text-text-secondary">Triggered</span>
              </div>
              <p className="font-medium text-text-primary">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="bg-surface-alt rounded-control p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs text-text-secondary">Status</span>
              </div>
              <p className="font-medium text-text-primary capitalize">
                {statusLabel[alert.status] || alert.status}
              </p>
            </div>
          </div>

          {/* Clinical guidance */}
          <div className="bg-orange-50 border border-orange-200 rounded-control p-4">
            <p className="text-xs font-medium text-status-warn uppercase tracking-wide mb-1.5">
              Clinical Guidance
            </p>
            <p className="text-sm text-text-primary leading-relaxed">
              {guidanceMap[alert.type] || 'Follow standard hospital protocol for this alert type.'}
            </p>
          </div>

          {/* Resolution note input — only if not resolved */}
          {alert.status !== 'resolved' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Resolution Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Describe the action taken to resolve this alert..."
                className="w-full px-3 py-2 rounded-control border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          )}

          {/* Show existing resolution note if resolved */}
          {alert.status === 'resolved' && alert.resolutionNote && (
            <div className="bg-green-50 border border-green-200 rounded-control p-3">
              <p className="text-xs font-medium text-status-ok mb-1">Resolution Note</p>
              <p className="text-sm text-text-primary">{alert.resolutionNote}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-status-critical bg-red-50 border border-red-200 rounded-control px-3 py-2">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-control border border-border text-sm text-text-secondary hover:bg-surface-alt transition-colors"
            >
              Close
            </button>
            {alert.status !== 'resolved' && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 px-4 py-2.5 rounded-control bg-status-ok text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resolving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {resolving ? 'Resolving...' : 'Mark Resolved'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
