const AppError = require('../utils/AppError');
const User = require('../models/user/User');
const WalletTransaction = require('../models/common/WalletTransaction');
const { getLowWalletAlertThreshold } = require('./configService');
const { createNotification } = require('./notificationService');

const creditWallet = async ({ ownerType, ownerId, amount, type, reference, meta = {} }) => {
  if (ownerType !== 'user') throw new AppError('Unsupported wallet owner type', 400, 'OWNER_TYPE_INVALID');
  const owner = await User.findById(ownerId);
  if (!owner) throw new AppError('Wallet owner not found', 404, 'WALLET_OWNER_NOT_FOUND');
  owner.walletBalance = Number(owner.walletBalance || 0) + Number(amount);
  await owner.save();
  await WalletTransaction.create({
    ownerType,
    owner: ownerId,
    amount,
    type,
    reference,
    meta,
    direction: 'credit',
    balanceAfter: owner.walletBalance
  });
  return owner;
};

const debitWallet = async ({ ownerType, ownerId, amount, type, reference, meta = {} }) => {
  if (ownerType !== 'user') throw new AppError('Unsupported wallet owner type', 400, 'OWNER_TYPE_INVALID');
  const owner = await User.findById(ownerId);
  if (!owner) throw new AppError('Wallet owner not found', 404, 'WALLET_OWNER_NOT_FOUND');
  const balance = Number(owner.walletBalance || 0);
  if (balance < amount) throw new AppError('Insufficient wallet balance', 402, 'INSUFFICIENT_BALANCE');
  const previousBalance = balance;
  owner.walletBalance = balance - Number(amount);
  await owner.save();
  await WalletTransaction.create({
    ownerType,
    owner: ownerId,
    amount,
    type,
    reference,
    meta,
    direction: 'debit',
    balanceAfter: owner.walletBalance
  });

  const threshold = await getLowWalletAlertThreshold();
  if (previousBalance > threshold && owner.walletBalance <= threshold) {
    await createNotification({
      recipientType: 'user',
      recipient: ownerId,
      title: 'Wallet balance is low',
      body: `Your wallet balance is now ${owner.walletBalance}. Please recharge to continue services.`,
      type: 'wallet',
      meta: { balance: owner.walletBalance, threshold }
    });
  }

  return owner;
};

module.exports = { creditWallet, debitWallet };
