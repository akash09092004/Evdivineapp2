const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const SESSION_STATUS = {
  CREATED: 'created',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELED: 'canceled'
};

const PAYMENT_STATUS = {
  CREATED: 'created',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REVERSED: 'reversed',
  PAID: 'paid'
};

const NOTIFICATION_TYPES = {
  CHAT: 'chat',
  CALL: 'call',
  VIDEO: 'video',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  KYC: 'kyc',
  REFUND: 'refund',
  REPORT: 'report'
};

module.exports = { ROLES, KYC_STATUS, SESSION_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPES };
