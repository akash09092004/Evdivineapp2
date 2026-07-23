const Banner = require('../../models/common/Banner');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { toPublicFileUrl, removeStoredUpload, toStoredUploadPath } = require('../../services/localUploadService');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toText = (value) => String(value ?? '').trim();

const toPayload = (req, doc) => ({
  _id: doc._id,
  title: doc.title,
  subtitle: doc.subtitle || '',
  imageUrl: toPublicFileUrl(req, doc.imageUrl || ''),
  linkType: doc.linkType || 'none',
  linkValue: doc.linkValue || '',
  description: doc.description || '',
  shortDescription: doc.shortDescription || doc.description || '',
  longContent: doc.longContent || '',
  benefits: doc.benefits || '',
  consultationPrice: toNumber(doc.consultationPrice, 0),
  offerPrice: toNumber(doc.offerPrice, 0),
  sortOrder: doc.sortOrder || 0,
  isActive: Boolean(doc.isActive),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const listBanners = asyncHandler(async (req, res) => {
  const rows = await Banner.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
  sendResponse(res, { data: rows.map((doc) => toPayload(req, doc)) });
});

const createBanner = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) {
    if (req.file?.filename) removeStoredUpload(toStoredUploadPath(req.file.filename));
    throw new AppError('title is required', 400, 'VALIDATION_ERROR');
  }
  if (!req.file?.filename) throw new AppError('image file is required', 400, 'IMAGE_REQUIRED');

  const imageUrl = toStoredUploadPath(req.file.filename);
  const doc = await Banner.create({
    title,
    subtitle: toText(req.body.subtitle),
    imageUrl,
    linkType: toText(req.body.linkType || 'none') || 'none',
    linkValue: toText(req.body.linkValue),
    description: toText(req.body.description || req.body.shortDescription),
    shortDescription: toText(req.body.shortDescription || req.body.description),
    longContent: toText(req.body.longContent),
    benefits: toText(req.body.benefits),
    consultationPrice: Math.max(0, toNumber(req.body.consultationPrice, 0)),
    offerPrice: Math.max(0, toNumber(req.body.offerPrice, 0)),
    sortOrder: toNumber(req.body.sortOrder, 0),
    isActive: req.body.isActive === undefined ? true : String(req.body.isActive) === 'true' || req.body.isActive === true
  });

  sendResponse(res, { message: 'Saved', data: toPayload(req, doc) });
});

const updateBanner = asyncHandler(async (req, res) => {
  const doc = await Banner.findById(req.params.id);
  if (!doc) throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');

  if (req.body.title !== undefined) doc.title = String(req.body.title).trim();
  if (req.body.subtitle !== undefined) doc.subtitle = String(req.body.subtitle || '').trim();
  if (req.body.linkType !== undefined) doc.linkType = String(req.body.linkType || 'none').trim();
  if (req.body.linkValue !== undefined) doc.linkValue = String(req.body.linkValue || '').trim();
  if (req.body.description !== undefined) doc.description = String(req.body.description || '').trim();
  if (req.body.shortDescription !== undefined) {
    doc.shortDescription = String(req.body.shortDescription || '').trim();
    if (req.body.description === undefined) {
      doc.description = doc.shortDescription;
    }
  }
  if (req.body.longContent !== undefined) doc.longContent = String(req.body.longContent || '').trim();
  if (req.body.benefits !== undefined) doc.benefits = String(req.body.benefits || '').trim();
  if (req.body.consultationPrice !== undefined) doc.consultationPrice = Math.max(0, toNumber(req.body.consultationPrice, 0));
  if (req.body.offerPrice !== undefined) doc.offerPrice = Math.max(0, toNumber(req.body.offerPrice, 0));
  if (req.body.sortOrder !== undefined) doc.sortOrder = toNumber(req.body.sortOrder, 0);
  if (req.body.isActive !== undefined) doc.isActive = String(req.body.isActive) === 'true' || req.body.isActive === true;
  if (req.body.removeImage === 'true' || req.body.removeImage === true) {
    removeStoredUpload(doc.imageUrl);
    doc.imageUrl = '';
  } else if (req.file?.filename) {
    removeStoredUpload(doc.imageUrl);
    doc.imageUrl = toStoredUploadPath(req.file.filename);
  }

  await doc.save();
  sendResponse(res, { message: 'Saved', data: toPayload(req, doc) });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const doc = await Banner.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
  removeStoredUpload(doc.imageUrl);
  sendResponse(res, { message: 'Banner deleted' });
});

module.exports = { listBanners, createBanner, updateBanner, deleteBanner };
