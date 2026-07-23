const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminRashiController');
const upload = require('../../middleware/uploadMiddleware');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listRashis);
router.post('/', requireAdmin, upload.single('image'), ctrl.createRashi);
router.put('/:id', requireAdmin, upload.single('image'), ctrl.updateRashi);
router.patch('/:id', requireAdmin, upload.single('image'), ctrl.updateRashi);
router.delete('/:id', requireAdmin, ctrl.deleteRashi);

module.exports = router;
