const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  chatRatePerMinute: { type: Number, default: 0, min: 0 },
  chatFreeSeconds: { type: Number, default: 300, min: 0 },
  voiceRatePerMinute: { type: Number, default: 0, min: 0 },
  videoRatePerMinute: { type: Number, default: 0, min: 0 },
  bookingBaseFee: { type: Number, default: 0, min: 0 },
  platformCommissionPercent: { type: Number, default: 0, min: 0, max: 100 },
  walletRechargeBonusPercent: { type: Number, default: 0, min: 0, max: 100 },
  lowWalletAlertThreshold: { type: Number, default: 100, min: 0 },
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PricingConfig', schema);
