const mongoose = require('mongoose');
const Rashi = require('../../models/common/Rashi');
const Banner = require('../../models/common/Banner');
const Horoscope = require('../../models/common/Horoscope');
const PageContent = require('../../models/admin/PageContent');
const AppError = require('../../utils/AppError');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const { toPublicFileUrl } = require('../../services/localUploadService');

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

const slugifyPageKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const cleanText = (value) => String(value ?? '').trim();

const supportedPageMap = new Map(
  SUPPORTED_PAGES.map((title) => [slugifyPageKey(title), title])
);

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

const humanizePageKey = (value) => {
  const key = String(value || '').trim();
  if (!key) return '';
  return key
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildPageLookupQuery = (pageKeyInput) => {
  const raw = cleanText(pageKeyInput);
  const slug = slugifyPageKey(raw);
  const title = supportedPageMap.get(slug) || '';
  const or = [];

  if (slug) {
    or.push({ pageKey: slug });
    or.push({ pageKey: raw });
    or.push({ page: slug });
    or.push({ page: raw });
  }
  if (raw) {
    or.push({ title: raw });
  }
  if (title && title !== raw) {
    or.push({ title });
  }

  return { $or: or.length ? or : [{ pageKey: '__no_match__' }] };
};

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

const toPublicRashi = (req, doc) => ({
  _id: doc._id ? String(doc._id) : undefined,
  name: doc.name || '',
  slug: doc.slug || '',
  element: doc.element || '',
  description: doc.description || doc.shortDescription || '',
  shortDescription: doc.shortDescription || doc.description || '',
  longContent: doc.longContent || '',
  benefits: doc.benefits || '',
  consultationPrice: typeof doc.consultationPrice === 'number' ? doc.consultationPrice : Number(doc.consultationPrice || 0),
  imageUrl: toPublicFileUrl(req, doc.imageUrl || '')
});

const toPublicBanner = (req, doc) => ({
  _id: doc._id ? String(doc._id) : undefined,
  title: doc.title || '',
  subtitle: doc.subtitle || '',
  imageUrl: toPublicFileUrl(req, doc.imageUrl || ''),
  linkType: doc.linkType || 'none',
  linkValue: doc.linkValue || '',
  description: doc.description || doc.shortDescription || '',
  shortDescription: doc.shortDescription || doc.description || '',
  longContent: doc.longContent || '',
  benefits: doc.benefits || '',
  consultationPrice: typeof doc.consultationPrice === 'number' ? doc.consultationPrice : Number(doc.consultationPrice || 0),
  offerPrice: typeof doc.offerPrice === 'number' ? doc.offerPrice : Number(doc.offerPrice || 0),
  sortOrder: doc.sortOrder || 0,
  isActive: typeof doc.isActive === 'boolean' ? doc.isActive : true,
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null
});

const listActiveRashis = asyncHandler(async (req, res) => {
  const rows = await Rashi.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  sendResponse(res, { data: rows.map((doc) => toPublicRashi(req, doc)) });
});

const getRashiBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  if (!slug) {
    throw new AppError('slug is required', 400, 'VALIDATION_ERROR');
  }

  const doc = await Rashi.findOne({
    isActive: true,
    $or: [
      { slug },
      { name: slug },
      { slug: String(req.params.slug || '').trim() },
      { name: String(req.params.slug || '').trim() },
    ],
  }).lean();

  if (!doc) {
    throw new AppError('Rashi not found', 404, 'RASHI_NOT_FOUND');
  }

  sendResponse(res, { data: toPublicRashi(req, doc) });
});

const listActiveBanners = asyncHandler(async (req, res) => {
  const rows = await Banner.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  sendResponse(res, { data: rows.map((doc) => toPublicBanner(req, doc)) });
});

const getActiveBannerById = asyncHandler(async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    throw new AppError('id is required', 400, 'VALIDATION_ERROR');
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
  }

  const doc = await Banner.findOne({ _id: id, isActive: true }).lean();
  if (!doc) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
  }

  sendResponse(res, { data: toPublicBanner(req, doc) });
});

const todayHoroscope = asyncHandler(async (req, res) => {
  const rashi = String(req.params.rashi || '').trim().toLowerCase();
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const item = await Horoscope.findOne({ rashi, date }).lean();
  sendResponse(res, { data: item || null });
});

const listPageContent = asyncHandler(async (req, res) => {
  const rows = await PageContent.find({ isActive: true }).sort({ createdAt: 1 }).lean();
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
  const pageKey = String(req.params.pageKey || '').trim();
  if (!pageKey) {
    throw new AppError('pageKey is required', 400, 'VALIDATION_ERROR');
  }

  const normalizedKey = slugifyPageKey(pageKey);
  const doc = await PageContent.findOne({
    isActive: true,
    $or: [
      { pageKey: normalizedKey },
      { pageKey },
      { page: normalizedKey },
      { page: pageKey },
      { title: pageKey },
    ],
  }).lean();

  if (!doc) {
    const fallbackTitle = supportedPageMap.get(normalizedKey) || pageKey;
    const pageContent = {
      _id: undefined,
      pageKey: normalizedKey,
      page: normalizedKey,
      title: fallbackTitle,
      keywords: '',
      description: '',
      content: '',
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };

    sendResponse(res, {
      data: {
        pageContent,
        item: pageContent,
      },
    });
    return;
  }

  const pageContent = toPublicPageContent(doc, pageKey);
  sendResponse(res, {
    data: {
      pageContent,
      item: pageContent,
    },
  });
});

module.exports = {
  listActiveRashis,
  getRashiBySlug,
  listActiveBanners,
  getActiveBannerById,
  todayHoroscope,
  listPageContent,
  getPageContentByKey,
};
