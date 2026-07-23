const Blog = require('../../models/common/Blog');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');
const {
  listPublicBlogs,
  listBlogCategories,
  getPublishedBlogBySlug,
  getRelatedBlogs,
  incrementBlogViews,
} = require('../../services/blogService');

const listBlogs = asyncHandler(async (req, res) => {
  const data = await listPublicBlogs(req.query);
  sendResponse(res, {
    message: 'Blogs fetched successfully',
    data,
  });
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await listBlogCategories({ publicOnly: true });
  sendResponse(res, {
    message: 'Categories fetched successfully',
    data: categories,
  });
});

const listFeaturedBlogs = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 6));
  const blogs = await Blog.find({
    isFeatured: true,
    $or: [
      { status: 'published' },
      {
        status: 'scheduled',
        $or: [
          { scheduledAt: null },
          { scheduledAt: { $lte: new Date() } },
        ],
      },
    ],
  })
    .populate('category')
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  sendResponse(res, {
    message: 'Featured blogs fetched successfully',
    data: blogs,
  });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await getPublishedBlogBySlug(req.params.slug);
  sendResponse(res, {
    message: 'Blog fetched successfully',
    data: blog,
  });
});

const getRelatedBlogsById = asyncHandler(async (req, res) => {
  const blogs = await getRelatedBlogs(req.params.id);
  sendResponse(res, {
    message: 'Related blogs fetched successfully',
    data: blogs,
  });
});

const incrementViewCount = asyncHandler(async (req, res) => {
  const blog = await incrementBlogViews(req.params.id);
  sendResponse(res, {
    message: 'Blog view recorded',
    data: {
      _id: blog._id,
      views: blog.views,
    },
  });
});

module.exports = {
  listBlogs,
  listCategories,
  listFeaturedBlogs,
  getBlogBySlug,
  getRelatedBlogsById,
  incrementViewCount,
};
