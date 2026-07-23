const {
  asyncHandler,
} = require("../../utils/asyncHandler");

const {
  sendResponse,
} = require("../../utils/responseHandler");

const {
  listBlogCategories,
  getBlogCategoryById,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  setBlogCategoryStatus,
} = require("../../services/blogService");

const getUploadedFile = (req) => {
  if (req.file) {
    return req.file;
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    return (
      req.files.find((file) => {
        const field = String(file?.fieldname || "").toLowerCase();
        return field === "image" || field === "categoryimage";
      }) || req.files[0]
    );
  }

  return null;
};

const listCategories = asyncHandler(async (req, res) => {
  const data = await listBlogCategories();

  sendResponse(res, {
    message: "Categories fetched successfully",
    data,
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const data = await getBlogCategoryById(req.params.id);

  sendResponse(res, {
    message: "Category fetched successfully",
    data,
  });
});

const createCategory = asyncHandler(
  async (req, res) => {
    const data = await createBlogCategory({
      body: req.body,
      file: getUploadedFile(req),
    });

    sendResponse(res, {
      statusCode: 201,
      message: "Category created successfully",
      data,
    });
  }
);

const updateCategory = asyncHandler(
  async (req, res) => {
    const data = await updateBlogCategory(
      req.params.id,
      {
        body: req.body,
        file: getUploadedFile(req),
      }
    );

    sendResponse(res, {
      message: "Category updated successfully",
      data,
    });
  }
);

const deleteCategory = asyncHandler(
  async (req, res) => {
    await deleteBlogCategory(req.params.id);

    sendResponse(res, {
      message: "Category deleted successfully",
    });
  }
);

const patchCategoryStatus = asyncHandler(
  async (req, res) => {
    const data = await setBlogCategoryStatus(
      req.params.id,
      {
        isActive:
          req.body.isActive ??
          req.body.value ??
          req.body.status,
      }
    );

    sendResponse(res, {
      message:
        "Category status updated successfully",
      data,
    });
  }
);

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  patchCategoryStatus,
  patchStatus: patchCategoryStatus,
};
