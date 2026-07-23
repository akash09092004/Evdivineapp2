const Rashi = require('../../models/common/Rashi');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { toPublicFileUrl, removeStoredUpload, toStoredUploadPath } = require('../../services/localUploadService');

const slugifyText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPayload = (req, doc) => ({
  _id: doc._id,
  name: doc.name,
  slug: doc.slug,
  element: doc.element || '',
  description: doc.description || doc.shortDescription || '',
  shortDescription: doc.shortDescription || doc.description || '',
  longContent: doc.longContent || '',
  benefits: doc.benefits || '',
  consultationPrice: toNumber(doc.consultationPrice, 0),
  imageUrl: toPublicFileUrl(req, doc.imageUrl || ''),
  sortOrder: doc.sortOrder || 0,
  isActive: Boolean(doc.isActive),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const listRashis = asyncHandler(async (req, res) => {
  const rows = await Rashi.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
  sendResponse(res, { data: rows.map((doc) => toPayload(req, doc)) });
});

const createRashi = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const slug = slugifyText(req.body.slug || name);
  const element = String(req.body.element || '').trim();
  const shortDescription = String(
    req.body.shortDescription !== undefined ? req.body.shortDescription : req.body.description || ''
  ).trim();
  const longContent = String(req.body.longContent || '').trim();
  const benefits = String(req.body.benefits || '').trim();
  const consultationPrice = Math.max(0, toNumber(req.body.consultationPrice, 0));
  const sortOrder = Number(req.body.sortOrder || 0);
  const isActive = req.body.isActive === undefined ? true : String(req.body.isActive) === 'true' || req.body.isActive === true;

  if (!name || !slug) {
    if (req.file?.filename) removeStoredUpload(toStoredUploadPath(req.file.filename));
    throw new AppError('name and slug are required', 400, 'VALIDATION_ERROR');
  }
  if (!req.file?.filename) throw new AppError('image file is required', 400, 'IMAGE_REQUIRED');

  const imageUrl = toStoredUploadPath(req.file.filename);

  const doc = await Rashi.create({
    name,
    slug,
    element,
    description: shortDescription,
    shortDescription,
    longContent,
    benefits,
    consultationPrice,
    imageUrl,
    sortOrder,
    isActive
  });

  sendResponse(res, { message: 'Saved', data: toPayload(req, doc) });
});

const updateRashi = asyncHandler(async (req, res) => {
  const doc = await Rashi.findById(req.params.id);
  if (!doc) throw new AppError('Rashi not found', 404, 'RASHI_NOT_FOUND');

  if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
  if (req.body.slug !== undefined) doc.slug = slugifyText(req.body.slug);
  if (req.body.element !== undefined) doc.element = String(req.body.element).trim();
  if (req.body.shortDescription !== undefined || req.body.description !== undefined) {
    const nextShortDescription = String(
      req.body.shortDescription !== undefined ? req.body.shortDescription : req.body.description || ''
    ).trim();
    doc.shortDescription = nextShortDescription;
    doc.description = nextShortDescription;
  }
  if (req.body.longContent !== undefined) doc.longContent = String(req.body.longContent).trim();
  if (req.body.benefits !== undefined) doc.benefits = String(req.body.benefits).trim();
  if (req.body.consultationPrice !== undefined) {
    doc.consultationPrice = Math.max(0, toNumber(req.body.consultationPrice, 0));
  }
  if (req.body.sortOrder !== undefined) doc.sortOrder = Number(req.body.sortOrder || 0);
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

const deleteRashi = asyncHandler(async (req, res) => {
  const doc = await Rashi.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Rashi not found', 404, 'RASHI_NOT_FOUND');
  removeStoredUpload(doc.imageUrl);
  sendResponse(res, { message: 'Rashi deleted' });
});

module.exports = { listRashis, createRashi, updateRashi, deleteRashi };
