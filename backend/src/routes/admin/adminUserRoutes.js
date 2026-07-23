const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminUserController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listUsers);
router.patch('/:id/block', requireAdmin, ctrl.blockUser);
router.patch('/:id/unblock', requireAdmin, ctrl.unblockUser);
router.patch('/:id/status', requireAdmin, ctrl.updateUserStatus);
router.patch('/:id/verification', requireAdmin, ctrl.updateUserVerification);
router.delete('/:id', requireAdmin, ctrl.deleteUser);

module.exports = router;
