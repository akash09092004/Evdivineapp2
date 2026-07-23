const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminRechargePlanController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listPlans);
router.post('/', requireAdmin, ctrl.createPlan);

module.exports = router;

