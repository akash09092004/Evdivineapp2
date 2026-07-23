import { useEffect, useMemo, useState } from "react";
import {
  fetchBlogBySlug,
  fetchBlogCategories,
  fetchBlogs,
  fetchFeaturedBlogs,
  fetchRelatedBlogs,
  trackBlogView,
} from "../Services/blogApi";
import { API_BASE_URL } from "../config/api";

const EMPTY_PAGINATION = {
  page: 1,
  limit: 9,
  totalBlogs: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const unwrapList = (payload, key) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload[key])) {
    return payload[key];
  }

  if (payload?.data) {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.data?.[key])) {
      return payload.data[key];
    }
  }

  return [];
};

const normalizeImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    if (/^https?:\/\//i.test(image) || /^data:image\//i.test(image)) {
      return image;
    }

    const trimmed = image.trim();
    if (trimmed.startsWith("/")) {
      return `${API_BASE_URL}${trimmed}`;
    }

    return trimmed ? `${API_BASE_URL}/${trimmed.replace(/^\/+/, "")}` : "";
  }

  const rawUrl =
    image.url ||
    image.imageUrl ||
    image.src ||
    image.secure_url ||
    image.thumbnailUrl ||
    image.publicUrl ||
    "";

  if (/^https?:\/\//i.test(rawUrl) || /^data:image\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/")) {
    return `${API_BASE_URL}${rawUrl}`;
  }

  return (
    rawUrl ? `${API_BASE_URL}/${String(rawUrl).replace(/^\/+/, "")}` : ""
  );
};

const normalizeBlogItem = (blog) => {
  if (!blog || typeof blog !== "object") {
    return blog;
  }

  const featuredImage = blog.featuredImage;
  const featuredImageUrl = normalizeImageUrl(featuredImage) || blog.featuredImageUrl || blog.imageUrl || "";

  return {
    ...blog,
    featuredImage:
      typeof featuredImage === "object" && featuredImage !== null
        ? {
            ...featuredImage,
            url: featuredImageUrl,
          }
        : featuredImageUrl
          ? { url: featuredImageUrl, altText: "" }
          : featuredImage,
  };
};

const normalizeCategoryItem = (category) => {
  if (!category || typeof category !== "object") {
    return category;
  }

  const image = category.image;
  const imageUrl = normalizeImageUrl(image) || category.imageUrl || "";

  return {
    ...category,
    image: image && typeof image === "object" ? { ...image, url: imageUrl } : imageUrl ? { url: imageUrl, altText: "" } : image,
    imageUrl,
  };
};

export function useBlogList(filters = {}) {
  const memoFilters = useMemo(() => filters, [filters]);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    blogs: [],
    featuredBlogs: [],
    pagination: EMPTY_PAGINATION,
    loading: true,
    refreshing: false,
    error: null,
  });

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setState((current) => ({
          ...current,
          loading: current.blogs.length === 0,
          refreshing: current.blogs.length > 0,
          error: null,
        }));

        const [blogsResponse, featuredResponse] = await Promise.all([
          fetchBlogs(memoFilters, { signal: controller.signal }),
          fetchFeaturedBlogs({ signal: controller.signal }).catch(() => ({ blogs: [] })),
        ]);

        if (!isActive) {
          return;
        }

        const blogs = unwrapList(blogsResponse, "blogs").map(normalizeBlogItem);
        const pagination =
          blogsResponse?.pagination ||
          blogsResponse?.data?.pagination ||
          EMPTY_PAGINATION;
        const featuredBlogs = unwrapList(featuredResponse, "blogs").map(normalizeBlogItem);

        setState({
          blogs,
          featuredBlogs,
          pagination: {
            ...EMPTY_PAGINATION,
            ...pagination,
          },
          loading: false,
          refreshing: false,
          error: null,
        });
      } catch (error) {
        if (!isActive || error?.name === "AbortError") {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error,
        }));
      }
    };

    load();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    memoFilters.page,
    memoFilters.limit,
    memoFilters.search,
    memoFilters.category,
    memoFilters.tags,
    memoFilters.featured,
    memoFilters.trending,
    memoFilters.sort,
    reloadToken,
  ]);

  return {
    ...state,
    refetch: () => {
      setReloadToken((value) => value + 1);
    },
  };
}

export function useBlogDetail(slug) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    blog: null,
    relatedBlogs: [],
    previousBlog: null,
    nextBlog: null,
    loading: Boolean(slug),
    relatedLoading: Boolean(slug),
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!slug) {
      setState({
        blog: null,
        relatedBlogs: [],
        previousBlog: null,
        nextBlog: null,
        loading: false,
        relatedLoading: false,
        error: null,
        notFound: false,
      });
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setState((current) => ({
          ...current,
          loading: true,
          relatedLoading: true,
          error: null,
          notFound: false,
        }));

        const [blogResponse, recentResponse] = await Promise.all([
          fetchBlogBySlug(slug, { signal: controller.signal }),
          fetchBlogs({ page: 1, limit: 100, sort: "latest" }, { signal: controller.signal }),
        ]);

        if (!isActive) {
          return;
        }

        const blog = normalizeBlogItem(blogResponse?.blog || blogResponse);
        const recentBlogs = (recentResponse?.blogs || []).map(normalizeBlogItem);
        const currentIndex = recentBlogs.findIndex((item) => item?.slug === slug);
        const previousBlog = currentIndex > 0 ? recentBlogs[currentIndex - 1] : null;
        const nextBlog =
          currentIndex >= 0 && currentIndex < recentBlogs.length - 1
            ? recentBlogs[currentIndex + 1]
            : null;

        setState((current) => ({
          ...current,
          blog,
          previousBlog,
          nextBlog,
          loading: false,
          error: null,
          notFound: false,
        }));

        if (blog?._id || blog?.id) {
          trackBlogView(blog._id || blog.id).catch(() => {});

          fetchRelatedBlogs(blog._id || blog.id, { signal: controller.signal })
            .then((relatedResponse) => {
              if (!isActive) {
                return;
              }

              const relatedBlogs = (relatedResponse?.blogs || relatedResponse || [])
                .map(normalizeBlogItem)
                .filter((item) => item?.slug !== blog?.slug);

              setState((current) => ({
                ...current,
                relatedBlogs,
                relatedLoading: false,
              }));
            })
            .catch(() => {
              if (!isActive) {
                return;
              }

              setState((current) => ({
                ...current,
                relatedBlogs: [],
                relatedLoading: false,
              }));
            });
        } else {
          setState((current) => ({
            ...current,
            relatedLoading: false,
          }));
        }
      } catch (error) {
        if (!isActive || error?.name === "AbortError") {
          return;
        }

        const message = String(error?.message || "").toLowerCase();
        const notFound =
          error?.status === 404 || message.includes("not found") || message.includes("no blog");

        setState({
          blog: null,
          relatedBlogs: [],
          previousBlog: null,
          nextBlog: null,
          loading: false,
          relatedLoading: false,
          error,
          notFound,
        });
      }
    };

    load();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [slug, reloadToken]);

  return {
    ...state,
    refetch: () => {
      setReloadToken((value) => value + 1);
    },
  };
}

export async function loadBlogCategories() {
  const response = await fetchBlogCategories();
  return unwrapList(response, "categories").map(normalizeCategoryItem);
}
