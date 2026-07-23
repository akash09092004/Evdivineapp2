const CONSULTATION_TYPES = {
  CHAT: "chat",
};

const BOOKING_STATUS = {
  PAYMENT_PENDING: "payment_pending",
  CONFIRMED: "confirmed",
  READY: "ready",
  WAITING_FOR_ADMIN: "waiting_for_admin",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PAYMENT_FAILED: "payment_failed",
  CANCELLED_BY_USER: "cancelled_by_user",
  CANCELLED_BY_ADMIN: "cancelled_by_admin",
  EXPIRED: "expired",
  REFUNDED: "refunded",
  NO_SHOW_USER: "no_show_user",
  NO_SHOW_ADMIN: "no_show_admin",
};

const PAYMENT_STATUS = {
  CREATED: "created",
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
  REVERSED: "reversed",
  PAID: "paid",
};

const SLOT_LOCK_STATUS = {
  ACTIVE: "active",
  CONVERTED: "converted",
  EXPIRED: "expired",
  RELEASED: "released",
};

const CHAT_STATUS = {
  SCHEDULED: "scheduled",
  WAITING: "waiting",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

const PAYMENT_METHODS = {
  WALLET: "wallet",
  PAYPAL: "paypal",
};

const TRANSACTION_TYPES = {
  WALLET_RECHARGE: "wallet_recharge",
  BOOKING_PAYMENT: "booking_payment",
  BOOKING_REFUND: "booking_refund",
  CHAT_EXTENSION: "chat_extension",
  ADMIN_CREDIT: "admin_credit",
  ADMIN_DEBIT: "admin_debit",
  PAYMENT_REVERSAL: "payment_reversal",
};

const DEFAULTS = {
  CURRENCY: "USD",
  TIMEZONE: "UTC",
  SLOT_LOCK_MINUTES: 5,
  CHAT_JOIN_BEFORE_MINUTES: 5,
  CHAT_JOIN_GRACE_MINUTES: 10,
  DEFAULT_BREAK_MINUTES: 10,
};

module.exports = {
  CONSULTATION_TYPES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SLOT_LOCK_STATUS,
  CHAT_STATUS,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  DEFAULTS,
};
