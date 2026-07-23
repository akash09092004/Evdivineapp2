const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  rashi: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  language: { type: String, default: 'en' },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

schema.index({ rashi: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Horoscope', schema);

