const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const formatErrors = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "";

  return items
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item.trim();

      const field = normalizeText(item.path || item.param || item.field || item.name);
      const message = normalizeText(item.msg || item.message || item.error);
      if (field && message) return `${field}: ${message}`;
      return message || field;
    })
    .filter(Boolean)
    .join(", ");
};

export const getApiErrorMessage = (payload, fallback = "Request failed") => {
  if (!payload) return fallback;

  const directMessage =
    normalizeText(payload.message) ||
    normalizeText(payload.error) ||
    normalizeText(payload.detail);

  const nestedData = payload.data;
  const nestedMessage =
    nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)
      ? normalizeText(nestedData.message) ||
        normalizeText(nestedData.error) ||
        formatErrors(nestedData.errors)
      : "";

  const arrayMessage = formatErrors(Array.isArray(nestedData) ? nestedData : payload.errors);

  if (payload.code === "VALIDATION_ERROR") {
    return arrayMessage || nestedMessage || directMessage || fallback;
  }

  return directMessage || nestedMessage || arrayMessage || fallback;
};
