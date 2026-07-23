import { API_BASE_URL } from "../config/api";

const unwrap = (payload) => payload?.data?.data ?? payload?.data ?? payload ?? {};

export const fetchRashis = async () => {
  const response = await fetch(`${API_BASE_URL}/api/content/rashis`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load rashis");
  }

  const data = unwrap(payload);
  return Array.isArray(data) ? data : [];
};

export const fetchRashiBySlug = async (slug) => {
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) {
    throw new Error("slug is required");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/content/rashis/${encodeURIComponent(safeSlug)}`
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load rashi details");
  }

  const data = unwrap(payload);
  return data?.item || data?.rashi || data?.data || data || null;
};
