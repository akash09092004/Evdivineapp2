const Coupon = require('../../models/common/Coupon');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  sendResponse(res, { message: 'Coupon created', data: coupon });
});

const listCoupons = asyncHandler(async (req, res) => {
  const rows = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  sendResponse(res, { message: 'Coupon updated', data: coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
  sendResponse(res, { message: 'Coupon deleted' });
});

module.exports = { createCoupon, listCoupons, updateCoupon, deleteCoupon };
