const router = require('express').Router();
const ctrl = require('../controllers/public/blogController');

router.get('/categories', ctrl.listCategories);
router.get('/featured', ctrl.listFeaturedBlogs);
router.get('/:id/related', ctrl.getRelatedBlogsById);
router.post('/:id/view', ctrl.incrementViewCount);
router.get('/:slug', ctrl.getBlogBySlug);
router.get('/', ctrl.listBlogs);

module.exports = router;
