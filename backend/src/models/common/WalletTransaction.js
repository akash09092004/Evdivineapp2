const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  ownerType: { type: String, enum: ['user'], required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['credit', 'debit'], required: true },
  type: { type: String, required: true },
  reference: { type: String, default: '' },
  transactionNumber: { type: String, default: '', index: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserWallet', default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  currency: { type: String, default: 'USD' },
  balanceBefore: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 },
  referenceType: { type: String, default: '' },
  referenceId: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, default: 'completed' },
  idempotencyKey: { type: String, default: '', index: true },
  rawGatewayResponse: { type: Object, default: {} },
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', schema);
