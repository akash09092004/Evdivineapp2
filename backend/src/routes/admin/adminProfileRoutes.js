const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminProfileController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.getProfile);

module.exports = router;
