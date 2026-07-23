const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminCompatController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listRefundTransactions);

module.exports = router;
