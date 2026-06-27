const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId:   { type: String, required: true, unique: true, trim: true },
    macAddress: { type: String, default: '' },
    location:   { type: String, default: '' },
    status: {
      type: String,
      enum: ['online', 'idle', 'offline', 'error'],
      default: 'idle',
    },
    batteryPct: { type: Number, default: 100 },
    lastSeen:   { type: Date, default: null },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
