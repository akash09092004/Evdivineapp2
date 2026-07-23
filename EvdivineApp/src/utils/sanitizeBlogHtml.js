const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeEntities = (value = "") =>
  value.replace(/&([a-z]+);/gi, (_, entity) => ENTITY_MAP[entity.toLowerCase()] || _);

export function sanitizeBlogHtml(html = "") {
  if (typeof html !== "string") {
    return "";
  }

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\sdata:[^"]*"/gi, '"');
}

export function htmlToPlainText(html = "") {
  const safeHtml = sanitizeBlogHtml(html);
  const text = safeHtml
    .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote|pre)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(text).replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

