const Refund = require('../models/common/Refund');
const { creditWallet } = require('./walletService');

const initiateRefund = async ({ userId, amount, paymentId, reason }) => {
  const refund = await Refund.create({ user: userId, amount, payment: paymentId, reason, status: 'pending' });
  await creditWallet({ ownerType: 'user', ownerId: userId, amount, type: 'refund', reference: paymentId, meta: { reason } });
  refund.status = 'processed';
  await refund.save();
  return refund;
};

module.exports = { initiateRefund };

