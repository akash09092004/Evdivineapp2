const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../../utils/constants');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  amount: { type: Number, required: true },
  expectedAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  purpose: { type: String, enum: ['wallet_recharge', 'chat', 'call', 'video', 'booking', 'refund'], required: true },
  status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
  orderId: { type: String, index: true, default: '' },
  paymentId: { type: String, index: true, default: '' },
  signature: { type: String, default: '' },
  gateway: { type: String, default: 'razorpay' },
  gatewayOrderId: { type: String, default: '', index: true },
  gatewayCaptureId: { type: String, default: '', index: true },
  platformCommissionAmount: { type: Number, default: 0 },
  gatewayFee: { type: Number, default: 0 },
  idempotencyKey: { type: String, default: '', index: true },
  rawGatewayResponse: { type: Object, default: {} },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'RechargePlan', default: null },
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Payment', schema);
