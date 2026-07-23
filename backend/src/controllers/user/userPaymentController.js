const Payment = require('../../models/common/Payment');
const { createOrder, verifyPaymentSignature } = require('../../services/paymentService');
const { createInvoice } = require('../../services/invoiceService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');
const { PAYMENT_STATUS } = require('../../utils/constants');

const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, purpose, meta = {} } = req.body;
  const order = await createOrder({ amount, receipt: `pay_${req.auth.id}_${Date.now()}`, notes: { userId: req.auth.id, purpose } });
  const payment = await Payment.create({ user: req.auth.id, amount, purpose, orderId: order.id, status: PAYMENT_STATUS.PENDING, meta });
  sendResponse(res, { message: 'Order created', data: { order, payment } });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) throw new AppError('Invalid signature', 400, 'PAYMENT_SIGNATURE_INVALID');
  const payment = await Payment.findOneAndUpdate({ orderId }, { paymentId, signature, status: PAYMENT_STATUS.PAID }, { new: true });
  if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  await createInvoice({ userId: req.auth.id, paymentId: payment._id, amount: payment.amount, gstPercent: Number(process.env.GST_PERCENT || 18), metadata: { purpose: payment.purpose } });
  sendResponse(res, { message: 'Payment verified', data: payment });
});

module.exports = { createPaymentOrder, verifyPayment };
