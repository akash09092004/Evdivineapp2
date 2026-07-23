const Referral = require('../../models/user/Referral');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listReferrals = asyncHandler(async (req, res) => {
  const rows = await Referral.find({})
    .populate('referrer')
    .populate('referredUser')
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, { data: rows });
});

module.exports = { listReferrals };
