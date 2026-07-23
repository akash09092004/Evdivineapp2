const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminPaymentController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listPayments);

module.exports = router;

