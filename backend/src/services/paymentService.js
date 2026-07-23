const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const AppError = require('../utils/AppError');
const Payment = require('../models/common/Payment');
const { PAYMENT_STATUS } = require('../utils/constants');

const isMockPaymentMode = () => {
  if (String(process.env.PAYMENT_MOCK || '').toLowerCase() === 'true') return true;
  return process.env.NODE_ENV !== 'production' && !process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_SECRET;
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  if (!razorpay) {
    if (!isMockPaymentMode()) {
      throw new AppError('Razorpay not configured', 500, 'RAZORPAY_NOT_CONFIGURED');
    }

    const mockAmount = Math.round(Number(amount) * 100);
    return {
      id: `mock_order_${Date.now()}`,
      entity: 'order',
      amount: mockAmount,
      amount_paid: 0,
      amount_due: mockAmount,
      currency,
      receipt,
      status: 'created',
      notes,
      provider: 'mock'
    };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt,
    notes
  });
  return order;
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (isMockPaymentMode()) {
    return Boolean(orderId && paymentId && signature);
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
};

const capturePaymentRecord = async ({ userId, amount, orderId, paymentId, status = PAYMENT_STATUS.PAID, meta = {} }) => {
  return Payment.create({ user: userId, amount, orderId, paymentId, status, meta });
};

module.exports = { createOrder, verifyPaymentSignature, capturePaymentRecord };
