const router = require('express').Router();
const ctrl = require('../controllers/admin/blogController');
const upload = require('../middleware/blogUpload');
const { requireAdmin } = require('../middleware/authMiddleware');
const {
  createBlogValidator,
  updateBlogValidator,
} = require('../validators/blogValidator');

const normalizeBlogBody = (req, _res, next) => {
  const body = req.body || {};
  const asString = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  };
  const readObjectValue = (value, keys = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    for (const key of keys) {
      if (value[key] !== undefined && value[key] !== null && String(value[key]).trim()) {
        return String(value[key]).trim();
      }
    }
    return '';
  };

  if (!asString(body.title)) {
    body.title =
      asString(body.blogTitle) ||
      asString(body.name) ||
      asString(body.postTitle) ||
      asString(body.articleTitle) ||
      asString(body.heading) ||
      asString(body.blog_name) ||
      '';
  }

  if (!asString(body.excerpt)) {
    body.excerpt =
      asString(body.summary) ||
      asString(body.shortDescription) ||
      asString(body.description) ||
      asString(body.postExcerpt) ||
      asString(body.blogExcerpt) ||
      asString(body.summaryText) ||
      '';
  }

  if (!asString(body.content)) {
    const contentAliases = [
      body.content,
      body.bodyHtml,
      body.html,
      body.contentHtml,
      body.articleContent,
      body.editorContent,
      body.editorState,
      body.richText,
      body.body,
      body.fullDescription,
      body.longDescription,
      body.blogContent,
      body.postContent,
      body.details,
      body.text,
      body.description,
      body.summary,
      body.shortDescription,
      body.excerpt,
    ];

    body.content = contentAliases.map(asString).find(Boolean) || '';
  }

  body.category =
    readObjectValue(body.categoryId, ['value', 'id', '_id', 'slug', 'name', 'label']) ||
    readObjectValue(body.category, ['value', 'id', '_id', 'slug', 'name', 'label']) ||
    asString(body.category) ||
    asString(body.categoryId) ||
    asString(body.categorySlug) ||
    asString(body.category_name) ||
    asString(body.categoryName) ||
    asString(body.blogCategory) ||
    asString(body.blogCategoryId) ||
    asString(body.selectedCategory) ||
    asString(body.selectedCategoryId) ||
    '';

  if (!body.slug) {
    body.slug = asString(body.blogSlug || body.postSlug || body.slug || '');
  }

  const normalizedStatus = asString(body.status).toLowerCase();
  if (normalizedStatus) {
    body.status =
      normalizedStatus === 'active'
        ? 'published'
        : normalizedStatus === 'inactive'
          ? 'draft'
          : normalizedStatus;
  }

  req.body = body;
  next();
};

router.get('/', requireAdmin, ctrl.listBlogs);
router.post('/', requireAdmin, upload.any(), normalizeBlogBody, createBlogValidator, ctrl.createBlogHandler);
router.get('/:id', requireAdmin, ctrl.getBlog);
router.put('/:id', requireAdmin, upload.any(), normalizeBlogBody, updateBlogValidator, ctrl.updateBlogHandler);
router.patch('/:id', requireAdmin, upload.any(), normalizeBlogBody, updateBlogValidator, ctrl.updateBlogHandler);
router.delete('/:id', requireAdmin, ctrl.deleteBlogHandler);
router.patch('/:id/status', requireAdmin, ctrl.patchStatus);
router.patch('/:id/featured', requireAdmin, ctrl.patchFeatured);
router.patch('/:id/trending', requireAdmin, ctrl.patchTrending);

module.exports = router;
