// backend/models/Reading.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    dropsPerMin: {
      type: Number,
      required: true,
    },
    volumeMl: {
      type: Number,
      required: true,
    },
    batteryPct: {
      type: Number,
    },
    signalStrength: {
      type: Number,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-delete readings older than 7 days to save storage
readingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Reading', readingSchema);
