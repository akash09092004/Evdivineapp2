const router = require('express').Router();
const ctrl = require('../../controllers/user/userPaymentController');
const { requireUser } = require('../../middleware/authMiddleware');

router.post('/order', requireUser, ctrl.createPaymentOrder);
router.post('/verify', requireUser, ctrl.verifyPayment);

module.exports = router;
