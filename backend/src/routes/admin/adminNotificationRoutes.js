const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminNotificationController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listNotifications);
router.post('/', requireAdmin, ctrl.createAdminNotification);
router.patch('/read', requireAdmin, ctrl.markRead);
router.delete('/:id', requireAdmin, ctrl.deleteNotification);

module.exports = router;
