const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  amount: { type: Number, required: true },
  gstPercent: { type: Number, default: Number(process.env.GST_PERCENT || 18) },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', schema);

