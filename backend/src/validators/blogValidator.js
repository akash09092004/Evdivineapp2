const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new AppError('Validation error', 400, 'VALIDATION_ERROR', errors.array())
  );
};

const createBlogValidator = [
  body('title').trim().notEmpty().withMessage('title is required').isLength({ max: 200 }),
  body('excerpt').trim().notEmpty().withMessage('excerpt is required').isLength({ max: 500 }),
  body('content').trim().notEmpty().withMessage('content is required'),
  body('category').trim().notEmpty().withMessage('category is required'),
  body('status').optional({ checkFalsy: true }).isIn(['draft', 'published', 'scheduled', 'archived']),
  body('metaTitle').optional({ checkFalsy: true }).isLength({ max: 70 }),
  body('metaDescription').optional({ checkFalsy: true }).isLength({ max: 160 }),
  body('scheduledAt').optional({ checkFalsy: true }).isISO8601().toDate(),
  validateRequest,
];

const updateBlogValidator = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('content').optional().trim(),
  body('category').optional().trim(),
  body('status').optional({ checkFalsy: true }).isIn(['draft', 'published', 'scheduled', 'archived']),
  body('metaTitle').optional({ checkFalsy: true }).isLength({ max: 70 }),
  body('metaDescription').optional({ checkFalsy: true }).isLength({ max: 160 }),
  body('scheduledAt').optional({ checkFalsy: true }).isISO8601().toDate(),
  validateRequest,
];

const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 }),
  validateRequest,
];

const updateCategoryValidator = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 }),
  validateRequest,
];

module.exports = {
  validateRequest,
  createBlogValidator,
  updateBlogValidator,
  createCategoryValidator,
  updateCategoryValidator,
};
