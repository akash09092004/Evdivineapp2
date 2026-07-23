const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bonus: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'credited', 'expired'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Referral', schema);

