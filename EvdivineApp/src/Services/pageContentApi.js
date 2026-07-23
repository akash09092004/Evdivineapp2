import { API_BASE_URL } from "../config/api";

const normalizePageKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unwrapResponse = (payload) => payload?.data?.data ?? payload?.data ?? {};

export const fetchPageContentList = async ({ authToken } = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/content/page-content`, {
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
        }
      : undefined,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load page content");
  }

  const data = unwrapResponse(payload);
  const pages = Array.isArray(data?.pages)
    ? data.pages
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  return {
    pages,
    total: Number(data?.total || pages.length || 0),
    raw: payload,
  };
};

export const fetchPageContentByKey = async ({ pageKey, authToken } = {}) => {
  const normalizedKey = normalizePageKey(pageKey);
  if (!normalizedKey) {
    throw new Error("pageKey is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/content/page-content/${encodeURIComponent(normalizedKey)}`,
    {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : undefined,
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load page content");
  }

  const data = unwrapResponse(payload);
  const pageContent = data?.pageContent || data?.item || data || null;
  return { pageContent, raw: payload };
};
