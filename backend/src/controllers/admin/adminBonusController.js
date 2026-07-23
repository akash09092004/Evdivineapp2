const User = require('../../models/user/User');
const WalletTransaction = require('../../models/common/WalletTransaction');
const { creditWallet } = require('../../services/walletService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');
const { getLatestBonusConfig, updateBonusConfig } = require('../../services/configService');

const getBonusConfig = asyncHandler(async (req, res) => {
  const config = await getLatestBonusConfig();
  sendResponse(res, { data: config });
});

const setBonusConfig = asyncHandler(async (req, res) => {
  const { referralBonus, welcomeBonus, manualBonusEnabled, notes, isActive } = req.body;
  const payload = {};

  if (referralBonus !== undefined) {
    const num = Number(referralBonus);
    if (!Number.isFinite(num) || num < 0) throw new AppError('referralBonus must be a non-negative number', 400, 'BONUS_INVALID');
    payload.referralBonus = num;
  }
  if (welcomeBonus !== undefined) {
    const num = Number(welcomeBonus);
    if (!Number.isFinite(num) || num < 0) throw new AppError('welcomeBonus must be a non-negative number', 400, 'BONUS_INVALID');
    payload.welcomeBonus = num;
  }
  if (manualBonusEnabled !== undefined) payload.manualBonusEnabled = !!manualBonusEnabled;
  if (notes !== undefined) payload.notes = notes;
  if (isActive !== undefined) payload.isActive = !!isActive;

  const config = await updateBonusConfig(payload);
  sendResponse(res, { message: 'Bonus settings updated', data: config });
});

const grantBonus = asyncHandler(async (req, res) => {
  const { ownerId, amount, reason = '', reference = '' } = req.body;

  if (!ownerId) {
    throw new AppError('ownerId is required', 400, 'OWNER_ID_REQUIRED');
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw new AppError('amount must be a positive number', 400, 'AMOUNT_INVALID');
  }

  const config = await getLatestBonusConfig();
  if (!config.manualBonusEnabled) {
    throw new AppError('Manual bonus is disabled', 403, 'BONUS_DISABLED');
  }

  const owner = await User.findById(ownerId);
  if (!owner) throw new AppError('user not found', 404, 'OWNER_NOT_FOUND');

  await creditWallet({
    ownerType: 'user',
    ownerId,
    amount: Number(amount),
    type: 'bonus',
    reference: reference || `bonus_${Date.now()}`,
    meta: { reason, grantedBy: req.auth.id }
  });

  const txFilter = {
    ownerType: 'user',
    owner: ownerId,
    type: 'bonus'
  };
  if (reference) txFilter.reference = reference;
  const tx = await WalletTransaction.findOne(txFilter).sort({ createdAt: -1 }).lean();

  sendResponse(res, {
    message: 'Bonus granted',
    data: { ownerType: 'user', ownerId, amount: Number(amount), reason, transaction: tx || null }
  });
});

const listBonusTransactions = asyncHandler(async (req, res) => {
  const filter = { type: 'bonus' };
  filter.ownerType = 'user';
  const rows = await WalletTransaction.find(filter).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { getBonusConfig, setBonusConfig, grantBonus, listBonusTransactions };
