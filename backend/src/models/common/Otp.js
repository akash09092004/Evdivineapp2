const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  purpose: { type: String, required: true, index: true, default: 'login' },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

schema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('Otp', schema);
