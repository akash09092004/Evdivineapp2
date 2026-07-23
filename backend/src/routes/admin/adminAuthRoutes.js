const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminAuthController');
const profileCtrl = require('../../controllers/admin/adminProfileController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.post('/login', ctrl.login);
router.get('/profile', requireAdmin, profileCtrl.getProfile);

module.exports = router;
