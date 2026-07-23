const User = require('../../models/user/User');
const Referral = require('../../models/user/Referral');
const { getLatestBonusConfig } = require('../../services/configService');
const { createReferralRecord } = require('../../services/referralService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');

const myReferral = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.id).lean();
  sendResponse(res, { data: { referralCode: user?.referralCode || '', referredBy: user?.referredBy || null } });
});

const referralHistory = asyncHandler(async (req, res) => {
  const rows = await Referral.find({ $or: [{ referrer: req.auth.id }, { referredUser: req.auth.id }] }).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) throw new AppError('referralCode is required', 400, 'REFERRAL_CODE_REQUIRED');
  const user = await User.findById(req.auth.id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  if (user.referredBy) throw new AppError('Referral already applied', 409, 'REFERRAL_ALREADY_APPLIED');

  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
  if (!referrer) throw new AppError('Invalid referral code', 400, 'REFERRAL_CODE_INVALID');
  if (referrer._id.toString() === user._id.toString()) throw new AppError('Cannot use your own referral code', 400, 'REFERRAL_CODE_INVALID');

  const bonusConfig = await getLatestBonusConfig();
  user.referredBy = referrer._id;
  await user.save();
  const referral = await createReferralRecord({
    referrer: referrer._id,
    referredUser: user._id,
    bonus: Number(bonusConfig.referralBonus || 0)
  });
  sendResponse(res, { message: 'Referral applied', data: referral });
});

module.exports = { myReferral, referralHistory, applyReferral };
