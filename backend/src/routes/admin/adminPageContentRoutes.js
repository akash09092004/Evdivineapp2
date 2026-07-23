const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminPageContentController');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listPageContent);
router.get('/:pageKey', requireAdmin, ctrl.getPageContentByKey);
router.put('/', requireAdmin, ctrl.upsertPageContent);
router.put('/:pageKey', requireAdmin, ctrl.upsertPageContent);
router.post('/', requireAdmin, ctrl.upsertPageContent);
router.post('/:pageKey', requireAdmin, ctrl.upsertPageContent);

module.exports = router;
