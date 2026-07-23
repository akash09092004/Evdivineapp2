const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: String, required: true, trim: true },
  booking: { type: String, required: true, trim: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'closed'], default: 'pending' },
  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CloseRequest', schema);
