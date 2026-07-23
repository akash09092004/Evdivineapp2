const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminInvoiceController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listInvoices);

module.exports = router;

