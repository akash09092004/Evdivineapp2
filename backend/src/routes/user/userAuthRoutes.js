const router = require('express').Router();
const ctrl = require('../../controllers/user/userAuthController');
const { requireUser } = require('../../middleware/authMiddleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/verify-otp', ctrl.verifyOtpForUser);
router.post('/resend-otp', ctrl.resendOtp);
router.get('/check-email', ctrl.checkEmail);
router.get('/check-phone', ctrl.checkPhone);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/guest-login', ctrl.guestLogin);
router.post('/logout', requireUser, ctrl.logout);
router.post('/delete-account', requireUser, ctrl.deleteAccount);

module.exports = router;
