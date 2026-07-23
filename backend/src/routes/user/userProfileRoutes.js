const router = require('express').Router();
const ctrl = require('../../controllers/user/userProfileController');
const { requireUser } = require('../../middleware/authMiddleware');

router.get('/me', requireUser, ctrl.getMe);
router.put('/me', requireUser, ctrl.updateMe);

module.exports = router;
