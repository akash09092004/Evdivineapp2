const Payment = require('../../models/common/Payment');
const { createOrder, verifyPaymentSignature } = require('../../services/paymentService');
const { createInvoice } = require('../../services/invoiceService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');
const { PAYMENT_STATUS } = require('../../utils/constants');

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
};

const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, purpose, meta = {} } = req.body;
  const order = await createOrder({ amount, receipt: `pay_${req.auth.id}_${Date.now()}`, notes: { userId: req.auth.id, purpose } });
  const payment = await Payment.create({ user: req.auth.id, amount, purpose, orderId: order.id, status: PAYMENT_STATUS.PENDING, meta });
  sendResponse(res, { message: 'Order created', data: { order, payment } });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) throw new AppError('Invalid signature', 400, 'PAYMENT_SIGNATURE_INVALID');
  const payment = await Payment.findOneAndUpdate({ orderId }, { paymentId, signature, status: PAYMENT_STATUS.COMPLETED }, { new: true });
  if (!payment) throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  await createInvoice({ userId: req.auth.id, paymentId: payment._id, amount: payment.amount, gstPercent: Number(process.env.GST_PERCENT || 18), metadata: { purpose: payment.purpose } });
  sendResponse(res, {
    message: 'Payment verified',
    data: {
      success: true,
      status: PAYMENT_STATUS.COMPLETED,
      payment,
    },
  });
});

const listPaymentHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const purpose = String(req.query.purpose || '').trim();
  const status = String(req.query.status || '').trim();
  const paymentFilter = { user: req.auth.id };

  if (purpose) {
    paymentFilter.purpose = purpose;
  }

  if (status) {
    paymentFilter.status = status;
  }

  const [items, total] = await Promise.all([
    Payment.find(paymentFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(paymentFilter),
  ]);

  sendResponse(res, {
    data: {
      items,
      total,
      page,
      limit,
    },
  });
});

module.exports = { createPaymentOrder, verifyPayment, listPaymentHistory };
