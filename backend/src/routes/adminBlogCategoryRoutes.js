const router = require('express').Router();
const ctrl = require('../controllers/admin/blogCategoryController');
const upload = require('../middleware/blogUpload');
const { requireAdmin } = require('../middleware/authMiddleware');
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require('../validators/blogValidator');

router.get('/', requireAdmin, ctrl.listCategories);
router.post('/', requireAdmin, upload.any(), createCategoryValidator, ctrl.createCategory);
router.get('/:id', requireAdmin, ctrl.getCategory);
router.put('/:id', requireAdmin, upload.any(), updateCategoryValidator, ctrl.updateCategory);
router.patch('/:id', requireAdmin, upload.any(), updateCategoryValidator, ctrl.updateCategory);
router.patch('/:id/status', requireAdmin, ctrl.patchStatus);
router.delete('/:id', requireAdmin, ctrl.deleteCategory);

module.exports = router;
