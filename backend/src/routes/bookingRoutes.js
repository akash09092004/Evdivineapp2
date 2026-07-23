const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { requireUser, requireAdmin } = require("../middleware/authMiddleware");
const userCtrl = require("../controllers/booking/userBookingController");
const adminCtrl = require("../controllers/booking/adminBookingController");

const bookingLockLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const bookingPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/users/chat-booking/slot-plans",
  requireUser,
  userCtrl.listChatSlotPlans
);
router.get(
  "/users/chat-booking/available-slots",
  requireUser,
  userCtrl.getAvailableSlots
);
router.post(
  "/users/chat-booking/lock-slot",
  requireUser,
  bookingLockLimiter,
  userCtrl.lockSlot
);
router.post(
  "/users/chat-booking/create",
  requireUser,
  bookingPaymentLimiter,
  userCtrl.createPendingBooking
);

router.post(
  "/users/payments/pay-from-wallet",
  requireUser,
  bookingPaymentLimiter,
  userCtrl.payFromWallet
);
router.post(
  "/users/payments/paypal/create-order",
  requireUser,
  bookingPaymentLimiter,
  userCtrl.createPaypalOrder
);
router.post(
  "/users/payments/paypal/capture",
  requireUser,
  bookingPaymentLimiter,
  userCtrl.capturePaypalOrder
);
router.post(
  "/users/payments/paypal/capture-order",
  requireUser,
  bookingPaymentLimiter,
  userCtrl.capturePaypalOrder
);

router.get("/users/bookings", requireUser, userCtrl.listMyBookings);
router.get("/users/bookings/:bookingId", requireUser, userCtrl.getMyBooking);
router.post(
  "/users/bookings/:bookingId/cancel",
  requireUser,
  userCtrl.cancelBooking
);

router.post("/users/chat/:bookingId/join", requireUser, userCtrl.joinChat);
router.get(
  "/users/chat/:bookingId/messages",
  requireUser,
  userCtrl.getMessages
);
router.post(
  "/users/chat/:bookingId/messages",
  requireUser,
  userCtrl.sendChatMessage
);
router.post("/users/chat/:bookingId/end", requireUser, userCtrl.endBookingChat);

router.post("/admin/slot-plans", requireAdmin, adminCtrl.createSlotPlan);
router.get("/admin/slot-plans", requireAdmin, adminCtrl.listSlotPlans);
router.get("/admin/slot-plans/:id", requireAdmin, adminCtrl.getSlotPlan);
router.patch("/admin/slot-plans/:id", requireAdmin, adminCtrl.updateSlotPlan);
router.patch(
  "/admin/slot-plans/:id/status",
  requireAdmin,
  adminCtrl.updateSlotPlanStatus
);
router.delete("/admin/slot-plans/:id", requireAdmin, adminCtrl.deleteSlotPlan);

router.get("/admin/availability", requireAdmin, adminCtrl.listAvailability);
router.post("/admin/availability", requireAdmin, adminCtrl.upsertAvailability);
router.patch(
  "/admin/availability/:id",
  requireAdmin,
  adminCtrl.patchAvailability
);

router.get("/admin/leaves", requireAdmin, adminCtrl.listLeaves);
router.post("/admin/leaves", requireAdmin, adminCtrl.createLeave);
router.delete("/admin/leaves/:id", requireAdmin, adminCtrl.deleteLeave);

router.get("/admin/blocked-times", requireAdmin, adminCtrl.listBlockedTimes);
router.post("/admin/blocked-times", requireAdmin, adminCtrl.createBlockedTime);
router.delete(
  "/admin/blocked-times/:id",
  requireAdmin,
  adminCtrl.deleteBlockedTime
);

router.get("/admin/bookings", requireAdmin, adminCtrl.listBookings);
router.get("/admin/bookings/today", requireAdmin, adminCtrl.listTodayBookings);
router.get(
  "/admin/bookings/upcoming",
  requireAdmin,
  adminCtrl.listUpcomingBookings
);
router.get("/admin/bookings/:bookingId", requireAdmin, adminCtrl.getBooking);
router.post(
  "/admin/bookings/:bookingId/cancel",
  requireAdmin,
  adminCtrl.cancelBooking
);

router.post("/admin/chat/:bookingId/join", requireAdmin, adminCtrl.joinChat);
router.get(
  "/admin/chat/:bookingId/messages",
  requireAdmin,
  adminCtrl.getMessages
);
router.post(
  "/admin/chat/:bookingId/messages",
  requireAdmin,
  adminCtrl.sendChatMessage
);
router.post(
  "/admin/chat/:bookingId/end",
  requireAdmin,
  adminCtrl.endBookingChat
);

module.exports = router;
