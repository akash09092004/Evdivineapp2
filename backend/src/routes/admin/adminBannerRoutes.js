const router = require('express').Router();
const ctrl = require('../../controllers/admin/adminBannerController');
const upload = require('../../middleware/uploadMiddleware');
const { requireAdmin } = require('../../middleware/authMiddleware');

router.get('/', requireAdmin, ctrl.listBanners);
router.post('/', requireAdmin, upload.single('image'), ctrl.createBanner);
router.put('/:id', requireAdmin, upload.single('image'), ctrl.updateBanner);
router.patch('/:id', requireAdmin, upload.single('image'), ctrl.updateBanner);
router.delete('/:id', requireAdmin, ctrl.deleteBanner);

module.exports = router;
