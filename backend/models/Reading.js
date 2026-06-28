const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
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
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    // ── String deviceId for easy lookup ──
    deviceId:    { type: String, required: true },
    dropsPerMin: { type: Number, default: 0 },
    volumeMl:    { type: Number, default: 0 },
    batteryPct:  { type: Number, default: 0 },
    recordedAt:  { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

readingSchema.index({ deviceId: 1, createdAt: -1 });
readingSchema.index({ session:  1, createdAt: -1 });

module.exports = mongoose.model('Reading', readingSchema);
