// backend/models/Ward.js
const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ward name is required'],
      unique: true,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    totalBeds: {
      type: Number,
      default: 0,
    },
    supervisorInCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ward', wardSchema);
