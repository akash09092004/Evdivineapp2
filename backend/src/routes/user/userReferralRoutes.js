const router = require('express').Router();
const ctrl = require('../../controllers/user/userReferralController');
const { requireUser } = require('../../middleware/authMiddleware');

router.get('/me', requireUser, ctrl.myReferral);
router.get('/history', requireUser, ctrl.referralHistory);
router.post('/apply', requireUser, ctrl.applyReferral);

module.exports = router;
