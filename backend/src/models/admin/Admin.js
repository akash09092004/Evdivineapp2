const mongoose = require('mongoose');
const { ROLES } = require('../../utils/constants');

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.ADMIN },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', schema);

