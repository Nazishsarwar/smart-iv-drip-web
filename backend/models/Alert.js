// backend/models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'air_bubble',
        'low_fluid',
        'drip_stopped',
        'drip_rate_deviation',
        'device_offline',
        'battery_low',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['unacknowledged', 'acknowledged', 'resolved', 'escalated'],
      default: 'unacknowledged',
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    nursePushToken: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
