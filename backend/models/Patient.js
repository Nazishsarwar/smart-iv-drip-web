// backend/models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    ward: {
      type: String,
      required: [true, 'Ward is required'],
      trim: true,
    },
    bedNumber: {
      type: String,
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
    },
    activeSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discharged'],
      default: 'active',
    },
    admittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
