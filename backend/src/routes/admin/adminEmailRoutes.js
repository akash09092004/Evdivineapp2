const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminEmailController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.post('/', requireAdmin, ctrl.sendAdminEmail);
router.post('/send', requireAdmin, ctrl.sendAdminEmail);

module.exports = router;
