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
      default: null,
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      default: null,
    },
    prescribedRate: { type: Number, required: true },
    totalVolume:    { type: Number, required: true },
    fluidType:      { type: String, default: 'Normal Saline' },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    startTime: { type: Date, default: Date.now },
    endTime:   { type: Date, default: null },
    endReason: { type: String, default: '' },
    endNote:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
