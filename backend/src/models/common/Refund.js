const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: '' },
  refundNumber: { type: String, default: '', index: true },
  requestedBy: { type: String, default: '' },
  originalAmount: { type: Number, default: 0 },
  refundPercentage: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String, default: 'wallet' },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'processed', 'rejected', 'completed'], default: 'pending' },
  walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', default: null, index: true },
  gatewayRef: { type: String, default: '' },
  processedAt: { type: Date },
  idempotencyKey: { type: String, default: '', index: true },
  rawGatewayResponse: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Refund', schema);
