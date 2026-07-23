const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: { type: String, default: '', trim: true },
    keywords: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PageContent', schema);
