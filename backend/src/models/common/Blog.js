const mongoose = require("mongoose");

const featuredImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Featured image URL is required"],
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    altText: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Image alt text cannot exceed 200 characters"],
    },
  },
  {
    _id: false,
  }
);

const seoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: [70, "Meta title cannot exceed 70 characters"],
    },

    metaDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },

    canonicalUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Canonical URL cannot exceed 300 characters"],
    },

    ogImage: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "OG image URL cannot exceed 500 characters"],
    },

    keywords: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "SEO keywords cannot exceed 500 characters"],
    },
  },
  {
    _id: false,
  }
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: [true, "Blog category is required"],
      index: true,
    },

    excerpt: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [
        500,
        "Short description cannot exceed 500 characters",
      ],
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    featuredImage: {
      type: featuredImageSchema,
      required: [true, "Featured image is required"],
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    authorName: {
      type: String,
      default: "Evdivine Admin",
      trim: true,
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },

    status: {
      type: String,
      enum: {
        values: ["draft", "published", "scheduled", "archived"],
        message: "Status must be draft, published, scheduled or archived",
      },
      required: true,
      default: "draft",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    seo: {
      type: seoSchema,
      default: () => ({
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
        ogImage: "",
        keywords: "",
      }),
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.pre("save", function managePublishedDate(next) {
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.status === "draft" || this.status === "archived") {
    this.publishedAt = null;
  }

  if (this.status === "scheduled") {
    const scheduledFor = this.scheduledAt ? new Date(this.scheduledAt) : null;
    if (scheduledFor && !Number.isNaN(scheduledFor.getTime()) && scheduledFor <= new Date()) {
      this.publishedAt = scheduledFor;
    }
  }

  next();
});

module.exports = mongoose.model("Blog", blogSchema);
