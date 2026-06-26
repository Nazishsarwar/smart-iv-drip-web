// backend/models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      trim: true,
    },
    macAddress: {
      type: String,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'idle', 'error'],
      default: 'idle',
    },
    batteryPct: {
      type: Number,
      default: 100,
    },
    assignedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    assignedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    lastSeenAt: {
      type: Date,
    },
    firmwareVersion: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
