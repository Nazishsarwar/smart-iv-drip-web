const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    floor:    { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ward', wardSchema);
