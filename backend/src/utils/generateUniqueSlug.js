const mongoose = require('mongoose');

const slugify = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'item';
};

const generateUniqueSlug = async (Model, value, options = {}) => {
  const baseSlug = slugify(value);
  const slugField = options.slugField || 'slug';
  const excludeId = options.excludeId || null;

  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const query = { [slugField]: candidate };

    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      query._id = { $ne: excludeId };
    }

    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists(query);
    if (!exists) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

module.exports = { generateUniqueSlug, slugify };
