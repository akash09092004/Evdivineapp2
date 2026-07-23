const {
  asyncHandler,
} = require("../../utils/asyncHandler");

const {
  sendResponse,
} = require("../../utils/responseHandler");

const {
  listAdminBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  setBlogStatus,
} = require("../../services/blogService");

const getUploadedFile = (req) => {
  if (req.file) {
    return req.file;
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    return (
      req.files.find((file) => {
        const field = String(file?.fieldname || "").toLowerCase();
        return field === "featuredimage" || field === "image";
      }) || req.files[0]
    );
  }

  return null;
};

const listBlogs = asyncHandler(async (req, res) => {
  const data = await listAdminBlogs(req.query);

  sendResponse(res, {
    message: "Blogs fetched successfully",
    data,
  });
});

const getBlog = asyncHandler(async (req, res) => {
  const data = await getBlogById(req.params.id);

  sendResponse(res, {
    message: "Blog fetched successfully",
    data,
  });
});

const createBlogHandler = asyncHandler(
  async (req, res) => {
    const data = await createBlog({
      body: req.body,
      file: getUploadedFile(req),
    });

    sendResponse(res, {
      statusCode: 201,
      message: "Blog created successfully",
      data,
    });
  }
);

const updateBlogHandler = asyncHandler(
  async (req, res) => {
    const data = await updateBlog(req.params.id, {
      body: req.body,
      file: getUploadedFile(req),
    });

    sendResponse(res, {
      message: "Blog updated successfully",
      data,
    });
  }
);

const deleteBlogHandler = asyncHandler(
  async (req, res) => {
    await deleteBlog(req.params.id);

    sendResponse(res, {
      message: "Blog deleted successfully",
    });
  }
);

const patchBlogStatus = asyncHandler(
  async (req, res) => {
    const data = await setBlogStatus(
      req.params.id,
      req.body
    );

    sendResponse(res, {
      message: "Blog status updated successfully",
      data,
    });
  }
);

const patchBlogFeatured = asyncHandler(async (req, res) => {
  const blog = await getBlogById(req.params.id);
  blog.isFeatured =
    req.body.isFeatured === undefined
      ? !blog.isFeatured
      : req.body.isFeatured === true ||
        String(req.body.isFeatured) === "true" ||
        String(req.body.value) === "true";

  await blog.save();

  sendResponse(res, {
    message: "Blog featured status updated successfully",
    data: blog,
  });
});

const patchBlogTrending = asyncHandler(async (req, res) => {
  const blog = await getBlogById(req.params.id);
  blog.isTrending =
    req.body.isTrending === undefined
      ? !blog.isTrending
      : req.body.isTrending === true ||
        String(req.body.isTrending) === "true" ||
        String(req.body.value) === "true";

  await blog.save();

  sendResponse(res, {
    message: "Blog trending status updated successfully",
    data: blog,
  });
});

module.exports = {
  listBlogs,
  getBlog,
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  patchBlogStatus,
  patchStatus: patchBlogStatus,
  patchFeatured: patchBlogFeatured,
  patchTrending: patchBlogTrending,
};
