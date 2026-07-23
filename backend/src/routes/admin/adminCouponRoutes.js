const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminCouponController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listCoupons);
router.post('/', requireAdmin, ctrl.createCoupon);
router.put('/:id', requireAdmin, ctrl.updateCoupon);
router.delete('/:id', requireAdmin, ctrl.deleteCoupon);

module.exports = router;
