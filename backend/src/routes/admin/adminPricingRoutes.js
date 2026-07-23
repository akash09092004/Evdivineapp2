const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminPricingController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.getPricingConfig);
router.put('/', requireAdmin, ctrl.setPricingConfig);

module.exports = router;
