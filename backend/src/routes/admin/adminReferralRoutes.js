const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminReferralController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listReferrals);

module.exports = router;
