const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  balance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  totalCredited: { type: Number, default: 0 },
  totalDebited: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('UserWallet', schema);
