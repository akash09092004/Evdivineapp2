const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Blog = require("../models/common/Blog");
const BlogCategory = require("../models/common/BlogCategory");
const AppError = require("../utils/AppError");

const normalizeSlug = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const normalizeTags = (tags) => {
  if (!tags) {
    return [];
  }

  let values = tags;

  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);

      values = Array.isArray(parsed)
        ? parsed
        : tags.split(",");
    } catch {
      values = tags.split(",");
    }
  }

  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
};

const getUploadedFilePath = (file) => {
  if (!file) {
    return "";
  }

  if (file.path && String(file.path).includes("/uploads/")) {
    const normalized = String(file.path).replace(/\\/g, "/");
    const uploadsIndex = normalized.indexOf("/uploads/");
    if (uploadsIndex >= 0) {
      return normalized.slice(uploadsIndex);
    }
  }

  return `/uploads/blogs/${file.filename}`;
};

const removeLocalFile = async (fileUrl) => {
  if (!fileUrl || !String(fileUrl).startsWith("/uploads/")) {
    return;
  }

  const filePath = path.join(
    process.cwd(),
    fileUrl.replace(/^\/+/, "")
  );

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Blog image deletion failed:", error.message);
    }
  }
};

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

const normalizeBoolean = (value) => {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  return false;
};

const normalizeStatus = (value, fallback = "draft") => {
  const status = String(value || fallback || "").trim().toLowerCase();
  if (!status) {
    return "draft";
  }

  if (["draft", "published", "scheduled", "archived"].includes(status)) {
    return status;
  }

  return "";
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const normalizeSeoKeywords = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join(", ");
  }

  return String(value).trim();
};

const resolveBlogCategory = async (value) => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    throw new AppError("Blog category is required", 400);
  }

  if (mongoose.Types.ObjectId.isValid(rawValue)) {
    const categoryById = await BlogCategory.findById(rawValue);

    if (categoryById) {
      return categoryById;
    }
  }

  const normalizedSlug = normalizeSlug(rawValue);
  const categoryBySlug = await BlogCategory.findOne({
    slug: normalizedSlug,
  });

  if (categoryBySlug) {
    return categoryBySlug;
  }

  const categoryByName = await BlogCategory.findOne({
    name: {
      $regex: `^${rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });

  if (categoryByName) {
    return categoryByName;
  }

  throw new AppError("Blog category not found", 404);
};

const resolveBlogCategoryId = async (value) => {
  const category = await resolveBlogCategory(value);
  return category._id;
};

/* =====================================================
   CATEGORY SERVICES
===================================================== */

const listBlogCategories = async ({
  includeInactive = true,
  publicOnly = false,
} = {}) => {
  const filter = publicOnly
    ? { isActive: true }
    : includeInactive
      ? {}
      : { isActive: true };

  return BlogCategory.find(filter).sort({
    name: 1,
  });
};

const getBlogCategoryById = async (id) => {
  validateObjectId(id, "category ID");

  const category = await BlogCategory.findById(id);

  if (!category) {
    throw new AppError("Blog category not found", 404);
  }

  return category;
};

const createBlogCategory = async ({ body, file }) => {
  const name = String(body.name || "").trim();

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  const slug = normalizeSlug(body.slug || name);

  if (!slug) {
    throw new AppError("Category slug is required", 400);
  }

  const duplicateCategory = await BlogCategory.findOne({
    $or: [
      { slug },
      {
        name: {
          $regex: `^${name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      },
    ],
  });

  if (duplicateCategory) {
    throw new AppError(
      "Category name or slug already exists",
      409
    );
  }

  const category = await BlogCategory.create({
    name,
    slug,
    description: String(body.description || "").trim(),
    image: file
      ? {
          url: getUploadedFilePath(file),
          publicId: getUploadedFilePath(file),
          altText:
            String(body.imageAltText || body.name || name).trim(),
        }
      : {
          url: "",
          publicId: "",
          altText: String(body.imageAltText || "").trim(),
        },
    isActive:
      body.isActive === undefined
        ? true
        : String(body.isActive) === "true",
  });

  return category;
};

const updateBlogCategory = async (id, { body, file }) => {
  const category = await getBlogCategoryById(id);
  const oldImageUrl = category.image?.url || "";

  if (body.name !== undefined) {
    const name = String(body.name).trim();

    if (!name) {
      throw new AppError("Category name is required", 400);
    }

    category.name = name;
  }

  if (body.slug !== undefined || body.name !== undefined) {
    const slug = normalizeSlug(
      body.slug || category.name
    );

    const duplicateCategory =
      await BlogCategory.findOne({
        slug,
        _id: {
          $ne: category._id,
        },
      });

    if (duplicateCategory) {
      throw new AppError(
        "Category slug already exists",
        409
      );
    }

    category.slug = slug;
  }

  if (body.description !== undefined) {
    category.description = String(
      body.description
    ).trim();
  }

  if (body.imageAltText !== undefined) {
    category.image = {
      ...(category.image?.toObject?.() || category.image || {}),
      altText: String(body.imageAltText).trim(),
    };
  }

  if (file) {
    category.image = {
      url: getUploadedFilePath(file),
      publicId: getUploadedFilePath(file),
      altText: String(
        body.imageAltText ||
          category.image?.altText ||
          category.name
      ).trim(),
    };
  }

  if (body.isActive !== undefined) {
    category.isActive =
      body.isActive === true ||
      String(body.isActive) === "true";
  }

  await category.save();

  if (file && oldImageUrl && oldImageUrl !== category.image?.url) {
    await removeLocalFile(oldImageUrl);
  }

  return category;
};

const deleteBlogCategory = async (id) => {
  const category = await getBlogCategoryById(id);

  const attachedBlogs = await Blog.countDocuments({
    category: category._id,
  });

  if (attachedBlogs > 0) {
    category.isActive = false;
    await category.save();
    return category;
  }

  await removeLocalFile(category.image?.url);
  await category.deleteOne();
};

const setBlogCategoryStatus = async (
  id,
  { isActive }
) => {
  const category = await getBlogCategoryById(id);

  category.isActive =
    isActive === true || String(isActive) === "true";

  await category.save();

  return category;
};

/* =====================================================
   ADMIN BLOG SERVICES
===================================================== */

const listAdminBlogs = async (query = {}) => {
  const {
    search = "",
    category = "",
    status = "",
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (String(search).trim()) {
    filter.$or = [
      {
        title: {
          $regex: String(search).trim(),
          $options: "i",
        },
      },
      {
        slug: {
          $regex: String(search).trim(),
          $options: "i",
        },
      },
      {
        excerpt: {
          $regex: String(search).trim(),
          $options: "i",
        },
      },
    ];
  }

  if (
    status &&
    ["draft", "published", "scheduled", "archived"].includes(
      String(status).toLowerCase()
    )
  ) {
    filter.status = String(status).toLowerCase();
  }

  if (category) {
    validateObjectId(category, "category ID");
    filter.category = category;
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (currentPage - 1) * pageSize;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Blog.countDocuments(filter),
  ]);

  return {
    blogs,
    pagination: {
      currentPage,
      pageSize,
      totalBlogs: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

const getBlogById = async (id) => {
  validateObjectId(id, "blog ID");

  const blog = await Blog.findById(id).populate(
    "category",
    "name slug"
  );

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  return blog;
};

const validateBlogCategory = async (categoryId) => {
  validateObjectId(categoryId, "category ID");

  const category = await BlogCategory.findById(
    categoryId
  );

  if (!category) {
    throw new AppError("Blog category not found", 404);
  }

  return category;
};

const createBlog = async ({ body, file }) => {
  const title = String(body.title || "").trim();
  const excerpt = String(body.excerpt || "").trim();
  const content = String(body.content || "").trim();
  const categoryId = body.category;
  const status = normalizeStatus(body.status || "draft");
  const scheduledAt = normalizeDate(body.scheduledAt);

  if (!title) {
    throw new AppError("Blog title is required", 400);
  }

  if (!excerpt) {
    throw new AppError(
      "Short description is required",
      400
    );
  }

  if (!content) {
    throw new AppError("Blog content is required", 400);
  }

  if (!categoryId) {
    throw new AppError("Blog category is required", 400);
  }

  if (!file) {
    throw new AppError(
      "Featured image is required",
      400
    );
  }

  if (!status) {
    await removeLocalFile(getUploadedFilePath(file));

    throw new AppError(
      "Status must be draft, published, scheduled or archived",
      400
    );
  }

  if (status === "scheduled") {
    if (!scheduledAt) {
      await removeLocalFile(getUploadedFilePath(file));
      throw new AppError(
        "Scheduled At is required when status is scheduled",
        400
      );
    }

    if (scheduledAt <= new Date()) {
      await removeLocalFile(getUploadedFilePath(file));
      throw new AppError(
        "Scheduled At must be a future date/time",
        400
      );
    }
  }

  const resolvedCategoryId = await resolveBlogCategoryId(categoryId);

  const slug = normalizeSlug(body.slug || title);

  if (!slug) {
    await removeLocalFile(getUploadedFilePath(file));

    throw new AppError("Blog slug is required", 400);
  }

  const duplicateBlog = await Blog.findOne({ slug });

  if (duplicateBlog) {
    await removeLocalFile(getUploadedFilePath(file));

    throw new AppError(
      "A blog with this slug already exists",
      409
    );
  }

  try {
    const blog = await Blog.create({
      title,
      slug,
      category: resolvedCategoryId,
      excerpt,
      content,
      featuredImage: {
        url: getUploadedFilePath(file),
        publicId: getUploadedFilePath(file),
        altText:
          String(
            body.featuredImageAltText || title
          ).trim(),
      },
      tags: normalizeTags(body.tags),
      authorName:
        String(body.authorName || "").trim() ||
        "Evdivine Admin",
      status,
      isFeatured: normalizeBoolean(body.isFeatured),
      isTrending: normalizeBoolean(body.isTrending),
      scheduledAt,
      seo: {
        metaTitle:
          String(body.metaTitle || "").trim() ||
          title.slice(0, 70),

        metaDescription:
          String(body.metaDescription || "").trim() ||
          excerpt.slice(0, 160),

        canonicalUrl: String(body.canonicalUrl || "").trim(),
        ogImage: String(body.ogImage || "").trim(),
        keywords: normalizeSeoKeywords(body.keywords),
      },
    });

    return getBlogById(blog._id);
  } catch (error) {
    await removeLocalFile(getUploadedFilePath(file));
    throw error;
  }
};

const updateBlog = async (
  id,
  { body, file }
) => {
  const blog = await getBlogById(id);
  const oldImageUrl = blog.featuredImage?.url || "";

  if (body.title !== undefined) {
    const title = String(body.title).trim();

    if (!title) {
      throw new AppError("Blog title is required", 400);
    }

    blog.title = title;
  }

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);

    if (!slug) {
      throw new AppError("Blog slug is required", 400);
    }

    const duplicateBlog = await Blog.findOne({
      slug,
      _id: {
        $ne: blog._id,
      },
    });

    if (duplicateBlog) {
      throw new AppError(
        "A blog with this slug already exists",
        409
      );
    }

    blog.slug = slug;
  }

  if (body.category !== undefined) {
    blog.category = await resolveBlogCategoryId(body.category);
  }

  if (body.excerpt !== undefined) {
    const excerpt = String(body.excerpt).trim();

    if (!excerpt) {
      throw new AppError(
        "Short description is required",
        400
      );
    }

    blog.excerpt = excerpt;
  }

  if (body.content !== undefined) {
    const content = String(body.content).trim();

    if (!content) {
      throw new AppError(
        "Blog content is required",
        400
      );
    }

    blog.content = content;
  }

  if (body.tags !== undefined) {
    blog.tags = normalizeTags(body.tags);
  }

  if (body.authorName !== undefined) {
    blog.authorName =
      String(body.authorName).trim() ||
      "Evdivine Admin";
  }

  if (body.status !== undefined) {
    const status = normalizeStatus(body.status);

    if (!status) {
      throw new AppError(
        "Status must be draft, published, scheduled or archived",
        400
      );
    }

    if (status === "scheduled") {
      const scheduledDate = normalizeDate(
        body.scheduledAt || blog.scheduledAt
      );

      if (!scheduledDate) {
        throw new AppError(
          "Scheduled At is required when status is scheduled",
          400
        );
      }

      if (scheduledDate <= new Date()) {
        throw new AppError(
          "Scheduled At must be a future date/time",
          400
        );
      }
    }

    blog.status = status;
  }

  if (body.metaTitle !== undefined) {
    blog.seo.metaTitle = String(
      body.metaTitle
    ).trim();
  }

  if (body.metaDescription !== undefined) {
    blog.seo.metaDescription = String(
      body.metaDescription
    ).trim();
  }

  if (body.canonicalUrl !== undefined) {
    blog.seo.canonicalUrl = String(body.canonicalUrl).trim();
  }

  if (body.ogImage !== undefined) {
    blog.seo.ogImage = String(body.ogImage).trim();
  }

  if (body.keywords !== undefined) {
    blog.seo.keywords = normalizeSeoKeywords(body.keywords);
  }

  if (body.featuredImageAltText !== undefined) {
    blog.featuredImage.altText = String(
      body.featuredImageAltText
    ).trim();
  }

  if (body.isFeatured !== undefined) {
    blog.isFeatured = normalizeBoolean(body.isFeatured);
  }

  if (body.isTrending !== undefined) {
    blog.isTrending = normalizeBoolean(body.isTrending);
  }

  if (body.scheduledAt !== undefined) {
    blog.scheduledAt = normalizeDate(body.scheduledAt);
  }

  if (file) {
    blog.featuredImage = {
      url: getUploadedFilePath(file),
      publicId: getUploadedFilePath(file),
      altText:
        String(
          body.featuredImageAltText ||
            blog.featuredImage?.altText ||
            blog.title
        ).trim(),
    };
  }

  try {
    await blog.save();

    if (file && oldImageUrl) {
      await removeLocalFile(oldImageUrl);
    }

    return getBlogById(blog._id);
  } catch (error) {
    if (file) {
      await removeLocalFile(getUploadedFilePath(file));
    }

    throw error;
  }
};

const deleteBlog = async (id) => {
  const blog = await getBlogById(id);
  const imageUrl = blog.featuredImage?.url;

  await blog.deleteOne();
  await removeLocalFile(imageUrl);
};

const setBlogStatus = async (id, body) => {
  const blog = await getBlogById(id);

  const status = normalizeStatus(body.status || body.value || "");

  if (!status) {
    throw new AppError(
      "Status must be draft, published, scheduled or archived",
      400
    );
  }

  if (status === "scheduled" && !blog.scheduledAt) {
    throw new AppError(
      "Scheduled At is required when status is scheduled",
      400
    );
  }

  blog.status = status;

  await blog.save();

  return getBlogById(blog._id);
};

/* =====================================================
   PUBLIC BLOG SERVICES
===================================================== */

const listPublishedBlogs = async (query = {}) => {
  const {
    search = "",
    category = "",
    page = 1,
    limit = 10,
  } = query;

  const now = new Date();
  const filter = {};
  const conditions = [
    {
      $or: [
        { status: "published" },
        {
          status: "scheduled",
          $or: [
            { scheduledAt: null },
            { scheduledAt: { $lte: now } },
          ],
        },
      ],
    },
  ];

  if (String(search).trim()) {
    conditions.push({
      $or: [
      {
        title: {
          $regex: String(search).trim(),
          $options: "i",
        },
      },
      {
        excerpt: {
          $regex: String(search).trim(),
          $options: "i",
        },
      },
      {
        tags: {
          $in: [
            new RegExp(String(search).trim(), "i"),
          ],
        },
      },
      ],
    });
  }

  if (category) {
    const categoryDocument =
      mongoose.Types.ObjectId.isValid(category)
        ? await BlogCategory.findById(category)
        : await BlogCategory.findOne({
            slug: normalizeSlug(category),
          });

    if (!categoryDocument) {
      return {
        blogs: [],
        pagination: {
          currentPage: 1,
          pageSize: Number(limit) || 10,
          totalBlogs: 0,
          totalPages: 0,
        },
      };
    }

    conditions.push({ category: categoryDocument._id });
  }

  if (conditions.length === 1) {
    Object.assign(filter, conditions[0]);
  } else {
    filter.$and = conditions;
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(limit) || 10, 1),
    50
  );

  const skip = (currentPage - 1) * pageSize;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .select("-content")
      .populate("category", "name slug image")
      .sort({
        publishedAt: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Blog.countDocuments(filter),
  ]);

  return {
    blogs,
    pagination: {
      currentPage,
      pageSize,
      totalBlogs: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

const getPublishedBlogBySlug = async (slug) => {
  const now = new Date();
  const blog = await Blog.findOne({
    slug: normalizeSlug(slug),
    $or: [
      { status: "published" },
      {
        status: "scheduled",
        $or: [
          { scheduledAt: null },
          { scheduledAt: { $lte: now } },
        ],
      },
    ],
  }).populate("category", "name slug image");

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  return blog;
};

const getRelatedBlogs = async (id, limit = 4) => {
  const blog = await getBlogById(id);
  const now = new Date();

  const related = await Blog.find({
    _id: { $ne: blog._id },
    category: blog.category,
    $or: [
      { status: "published" },
      {
        status: "scheduled",
        $or: [
          { scheduledAt: null },
          { scheduledAt: { $lte: now } },
        ],
      },
    ],
  })
    .select("-content")
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.max(1, Number(limit) || 4))
    .populate("category", "name slug image")
    .lean();

  return related;
};

const incrementBlogViews = async (id) => {
  const blog = await getBlogById(id);
  blog.views = Number(blog.views || 0) + 1;
  await blog.save();
  return blog;
};

module.exports = {
  normalizeSlug,

  listBlogCategories,
  getBlogCategoryById,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  setBlogCategoryStatus,

  listAdminBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  setBlogStatus,

  listPublishedBlogs,
  listPublicBlogs: listPublishedBlogs,
  getPublishedBlogBySlug,
  getRelatedBlogs,
  incrementBlogViews,
};
