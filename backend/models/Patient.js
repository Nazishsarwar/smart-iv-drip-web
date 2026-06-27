const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    age:       { type: Number, default: null },
    gender:    { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    ward:      { type: String, required: true },
    bedNumber: { type: String, required: true },
    diagnosis: { type: String, default: '' },
    phone:     { type: String, default: '' },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical', 'offline', 'inactive', 'active'],
      default: 'active',
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      default: null,
    },
    activeSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    admittedAt: { type: Date, default: Date.now },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
