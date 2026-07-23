const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminDropMessageController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listDropMessages);
router.post('/', requireAdmin, ctrl.createDropMessage);
router.post('/:id/reply', requireAdmin, ctrl.replyToDropMessage);
router.put('/:id', requireAdmin, ctrl.updateDropMessage);

module.exports = router;
