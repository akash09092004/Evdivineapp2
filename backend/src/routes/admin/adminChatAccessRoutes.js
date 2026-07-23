const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminChatAccessController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listRequests);
router.post('/:id/approve', requireAdmin, ctrl.approveRequest);
router.post('/:id/reject', requireAdmin, ctrl.rejectRequest);
router.patch('/:id/approve', requireAdmin, ctrl.approveRequest);
router.patch('/:id/reject', requireAdmin, ctrl.rejectRequest);
router.all('*', requireAdmin, ctrl.handleDecisionRoute);

module.exports = router;
