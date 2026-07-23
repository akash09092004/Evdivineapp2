const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminRefundController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listRefunds);
router.post('/', requireAdmin, ctrl.processRefund);

module.exports = router;

