const Coupon = require('../models/common/Coupon');

const validateCoupon = async ({ code, amount, userId }) => {
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
  if (!coupon) return { valid: false, discount: 0, coupon: null };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, discount: 0, coupon: null };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, discount: 0, coupon: null };
  if (coupon.minAmount && amount < coupon.minAmount) return { valid: false, discount: 0, coupon: null };
  const discount = coupon.type === 'percentage' ? (amount * coupon.value) / 100 : coupon.value;
  return { valid: true, discount: Math.min(discount, amount), coupon };
};

module.exports = { validateCoupon };

