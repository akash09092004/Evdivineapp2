import { API_BASE_URL } from "../config/api";

const buildUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      const compact = value
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (compact.length > 0) {
        url.searchParams.set(key, compact.join(","));
      }

      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    signal: options.signal,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.data ?? payload;
}

export function fetchBlogs(params = {}, options = {}) {
  return requestJson(buildUrl("/api/blogs", params), { signal: options.signal });
}

export function fetchBlogCategories(options = {}) {
  return requestJson(buildUrl("/api/blogs/categories"), { signal: options.signal });
}

export function fetchFeaturedBlogs(options = {}) {
  return requestJson(buildUrl("/api/blogs/featured"), { signal: options.signal });
}

export function fetchBlogBySlug(slug, options = {}) {
  if (!slug) {
    return Promise.reject(new Error("Blog slug is required"));
  }

  return requestJson(buildUrl(`/api/blogs/${encodeURIComponent(slug)}`), {
    signal: options.signal,
  });
}

export function fetchRelatedBlogs(blogId, options = {}) {
  if (!blogId) {
    return Promise.resolve({ blogs: [] });
  }

  return requestJson(buildUrl(`/api/blogs/${encodeURIComponent(blogId)}/related`), {
    signal: options.signal,
  });
}

export function trackBlogView(blogId, options = {}) {
  if (!blogId) {
    return Promise.resolve(null);
  }

  return requestJson(buildUrl(`/api/blogs/${encodeURIComponent(blogId)}/view`), {
    method: "POST",
    signal: options.signal,
    body: {},
    headers: options.headers,
  });
}
