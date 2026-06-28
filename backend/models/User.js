const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type:     String,
      required: true,
      select:   false, // ← never returned in queries unless .select('+password')
    },
    role: {
      type:    String,
      enum:    ['superadmin', 'supervisor', 'admin'],
      default: 'supervisor',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
