const Coupon = require('../../models/common/Coupon');
const { validateCoupon } = require('../../services/couponService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listCoupons = asyncHandler(async (req, res) => {
  const rows = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  const result = await validateCoupon({ code, amount, userId: req.auth.id });
  sendResponse(res, { data: result });
});

module.exports = { listCoupons, applyCoupon };
