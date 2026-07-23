const PageContent = require('../../models/admin/PageContent');
const AppError = require('../../utils/AppError');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const SUPPORTED_PAGES = [
  'Home Page',
  'About Us',
  'FAQ',
  'Contact Us',
  'Legal Info',
  'Terms and Conditions',
  'Privacy Policies',
  'Agreement',
  'Advisor Terms and Conditions',
  'My Profile',
  'My Booking',
  'Booking History',
  'Payment Methods',
  'Notifications',
  'Help Support',
  'Logout',
];

const slugifyPageKey = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  return raw
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const humanizePageKey = (value) => {
  const key = String(value || '').trim();
  if (!key) return '';
  const specialTitles = new Map(
    SUPPORTED_PAGES.map((title) => [slugifyPageKey(title), title])
  );
  if (specialTitles.has(slugifyPageKey(key))) {
    return specialTitles.get(slugifyPageKey(key));
  }

  return key
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const cleanText = (value) => String(value ?? '').trim();

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const validationError = (message, field = 'pageKey') => {
  throw new AppError(message, 400, 'VALIDATION_ERROR', [
    { path: field, msg: message },
  ]);
};

const getCandidatePageKeys = (...values) =>
  [...new Set(values.map(slugifyPageKey).filter(Boolean))];

const buildAliasLookupQuery = (pageKeyInput) => {
  const raw = cleanText(pageKeyInput);
  const slug = slugifyPageKey(raw);
  const titleSlug = SUPPORTED_PAGES.map((title) => slugifyPageKey(title)).find(
    (item) => item === slug
  );
  const candidates = getCandidatePageKeys(raw, slug, titleSlug);
  const rawTitle = humanizePageKey(raw);

  const or = [];
  if (candidates.length) {
    or.push({ pageKey: { $in: candidates } });
    or.push({ page: { $in: candidates } });
  }
  if (raw) {
    or.push({ pageKey: raw });
    or.push({ page: raw });
    or.push({ title: raw });
  }
  if (rawTitle && rawTitle !== raw) {
    or.push({ title: rawTitle });
  }

  return {
    $or: or.length ? or : [{ pageKey: '__no_match__' }],
  };
};

const buildExactPageKeyQuery = (pageKeyInput) => {
  const pageKey = slugifyPageKey(pageKeyInput);
  return pageKey ? { pageKey } : { pageKey: '__no_match__' };
};

const supportedPageMap = new Map(
  SUPPORTED_PAGES.map((title) => [slugifyPageKey(title), title])
);

const toPublicPageContent = (doc, fallbackTitle = '') => {
  if (!doc) return null;
  const pageKey = slugifyPageKey(doc.pageKey || doc.page || doc.title || fallbackTitle);
  const title =
    cleanText(doc.title) ||
    supportedPageMap.get(pageKey) ||
    humanizePageKey(pageKey) ||
    humanizePageKey(fallbackTitle);

  return {
    _id: doc._id ? String(doc._id) : undefined,
    pageKey,
    page: pageKey,
    title,
    keywords: cleanText(doc.keywords),
    description: cleanText(doc.description),
    content: cleanText(doc.content),
    isActive: typeof doc.isActive === 'boolean' ? doc.isActive : true,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
};

const mergeWithSupportedPages = (rows = []) => {
  const byKey = new Map();

  rows.forEach((row) => {
    const normalized = toPublicPageContent(row);
    if (!normalized?.pageKey) return;
    byKey.set(normalized.pageKey, normalized);
  });

  const merged = SUPPORTED_PAGES.map((title) => {
    const pageKey = slugifyPageKey(title);
    const existing = byKey.get(pageKey);
    if (existing) {
      return {
        ...existing,
        pageKey,
        page: pageKey,
        title: existing.title || title,
      };
    }

    return {
      _id: undefined,
      pageKey,
      page: pageKey,
      title,
      keywords: '',
      description: '',
      content: '',
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };
  });

  rows.forEach((row) => {
    const normalized = toPublicPageContent(row);
    if (!normalized?.pageKey) return;
    if (supportedPageMap.has(normalized.pageKey)) return;
    if (!byKey.has(normalized.pageKey)) {
      merged.push(normalized);
    }
  });

  return merged;
};

const listPageContent = asyncHandler(async (req, res) => {
  const rows = await PageContent.find({}).sort({ createdAt: 1 }).lean();
  const pages = mergeWithSupportedPages(rows);

  sendResponse(res, {
    data: {
      pages,
      items: pages,
      total: pages.length,
    },
  });
});

const getPageContentByKey = asyncHandler(async (req, res) => {
  const pageKey = cleanText(req.params.pageKey);
  if (!pageKey) {
    validationError('pageKey is required');
  }

  const doc = await PageContent.findOne(buildAliasLookupQuery(pageKey)).lean();
  if (!doc) {
    throw new AppError('Page content not found', 404, 'PAGE_CONTENT_NOT_FOUND');
  }

  const pageContent = toPublicPageContent(doc, pageKey);

  sendResponse(res, {
    data: {
      pageContent,
      item: pageContent,
    },
  });
});

const upsertPageContent = asyncHandler(async (req, res) => {
  const pageKeyInput = req.params.pageKey || req.body.pageKey || req.body.page || req.body.title;
  const pageKey = slugifyPageKey(pageKeyInput);
  const titleInput = cleanText(req.body.title);
  const keywords = cleanText(req.body.keywords);
  const description = cleanText(req.body.description);
  const content = cleanText(req.body.content);
  const isActive = normalizeBoolean(req.body.isActive, true);

  if (!pageKey) {
    validationError('pageKey is required');
  }

  const existing = await PageContent.findOne(buildAliasLookupQuery(pageKey));
  const fallbackTitle =
    titleInput ||
    existing?.title ||
    supportedPageMap.get(pageKey) ||
    humanizePageKey(pageKey);

  if (!fallbackTitle) {
    validationError('title is required', 'title');
  }

  const update = {
    pageKey,
    title: fallbackTitle,
    keywords,
    description,
    content,
    isActive,
  };

  const doc = await PageContent.findOneAndUpdate(
    buildExactPageKeyQuery(pageKey),
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  if (doc && slugifyPageKey(doc.pageKey) !== pageKey) {
    doc.pageKey = pageKey;
    doc.title = fallbackTitle;
    doc.keywords = keywords;
    doc.description = description;
    doc.content = content;
    doc.isActive = isActive;
    await doc.save();
  }

  const pageContent = toPublicPageContent(doc, fallbackTitle);

  sendResponse(res, {
    message: 'Page content saved',
    data: {
      pageContent,
      item: pageContent,
    },
  });
});

module.exports = {
  listPageContent,
  getPageContentByKey,
  upsertPageContent,
  SUPPORTED_PAGES,
};
