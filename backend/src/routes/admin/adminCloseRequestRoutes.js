const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminCloseRequestController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listCloseRequests);
router.post('/', requireAdmin, ctrl.createCloseRequest);
router.put('/:id', requireAdmin, ctrl.updateCloseRequest);

module.exports = router;
