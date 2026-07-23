const mongoose = require('mongoose');
const { ROLES } = require('../../utils/constants');

const userSchema = new mongoose.Schema({
  deviceId: { type: String, trim: true, index: true, unique: true, sparse: true },
  phone: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, trim: true, lowercase: true, index: true, sparse: true },
  name: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  dob: { type: Date },
  birthTime: { type: String, default: '' },
  birthPlace: { type: String, default: '' },
  city: { type: String, default: '' },
  timeOfBirth: { type: String, default: '' },
  placeOfBirth: { type: String, default: '' },
  currentCity: { type: String, default: '' },
  zodiacSign: { type: String, default: '' },
  language: { type: String, default: 'en' },
  rashi: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  guest: { type: Boolean, default: false },
  passwordHash: { type: String, default: '' },
  referralCode: { type: String, index: true, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  otpVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  chatAccessStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  chatAccessRequestedAt: { type: Date },
  chatAccessReviewedAt: { type: Date },
  chatAccessReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  chatAccessReason: { type: String, default: '' },
  walletBalance: { type: Number, default: 0 },
  fcmToken: { type: String, default: '' },
  isBlocked: { type: Boolean, default: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.USER }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
