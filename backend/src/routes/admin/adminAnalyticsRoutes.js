const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminAnalyticsController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/dashboard', requireAdmin, ctrl.dashboard);

module.exports = router;

