// backend/models/Nurse.js
const mongoose = require('mongoose');

const nurseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nurse name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    ward: {
      type: String,
      required: [true, 'Ward is required'],
      trim: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night'],
      default: 'Morning',
    },
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    pushToken: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Nurse', nurseSchema);
