// backend/models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    prescribedRateDpm: {
      type: Number,
      required: [true, 'Prescribed drip rate is required'],
    },
    prescribedVolumeMl: {
      type: Number,
      required: [true, 'Prescribed volume is required'],
    },
    fluidType: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'interrupted'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    endReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
