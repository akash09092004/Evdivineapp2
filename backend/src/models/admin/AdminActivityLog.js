const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  action: { type: String, required: true },
  entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('AdminActivityLog', schema);

