const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  linkType: { type: String, enum: ['none', 'screen', 'url', 'service', 'rashi'], default: 'none' },
  linkValue: { type: String, default: '' },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  longContent: { type: String, default: '' },
  benefits: { type: String, default: '' },
  consultationPrice: { type: Number, default: 0, min: 0 },
  offerPrice: { type: Number, default: 0, min: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', schema);
