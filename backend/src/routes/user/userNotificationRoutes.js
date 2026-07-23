const router = require('express').Router();
const ctrl = require('../../controllers/user/userNotificationController');
const { requireUser } = require('../../middleware/authMiddleware');

router.get('/', requireUser, ctrl.listNotifications);
router.patch('/read', requireUser, ctrl.markRead);
router.delete('/:id', requireUser, ctrl.deleteNotification);

module.exports = router;
