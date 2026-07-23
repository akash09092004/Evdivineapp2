const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  referralBonus: { type: Number, default: 0, min: 0 },
  welcomeBonus: { type: Number, default: 0, min: 0 },
  manualBonusEnabled: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BonusConfig', schema);
