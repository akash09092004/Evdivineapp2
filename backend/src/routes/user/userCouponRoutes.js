const router = require('express').Router();
const ctrl = require('../../controllers/user/userCouponController');
const { requireUser } = require('../../middleware/authMiddleware');

router.get('/', requireUser, ctrl.listCoupons);
router.post('/apply', requireUser, ctrl.applyCoupon);

module.exports = router;
