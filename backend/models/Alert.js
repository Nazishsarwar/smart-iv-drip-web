const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'air_bubble',
        'low_fluid',
        'drip_stopped',
        'high_rate',
        'low_rate',
        'device_offline',
        'manual',
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },

    message:     { type: String, default: '' },
    patientName: { type: String, default: '' },
    ward:        { type: String, default: '' },
    deviceId:    { type: String, default: '' },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: { type: Date, default: null },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt:     { type: Date,   default: null },
    resolutionNote: { type: String, default: '' },

    escalated:   { type: Boolean, default: false },
    escalatedAt: { type: Date,    default: null },
  },
  { timestamps: true }
);

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ patient: 1 });
alertSchema.index({ device: 1 });
alertSchema.index({ severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
