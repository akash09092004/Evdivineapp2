const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  bonusAmount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('RechargePlan', schema);

