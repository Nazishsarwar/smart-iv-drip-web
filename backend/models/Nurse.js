const mongoose = require('mongoose');

const nurseSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    phone:    { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    ward:     { type: String, default: '' },
    shift: {
      type:    String,
      enum:    ['Morning', 'Evening', 'Night'],
      default: 'Morning',
    },
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Patient',
      },
    ],
    isActive:  { type: Boolean, default: true },
    pushToken: { type: String,  default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Nurse', nurseSchema);
