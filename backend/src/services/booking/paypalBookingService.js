const Payment = require("../../models/common/Payment");
const Booking = require("../../models/booking/Booking");
const AppError = require("../../utils/AppError");
const { PAYMENT_STATUS } = require("../../utils/bookingConstants");
const { createPayPalOrder, capturePayPalOrder } = require("../paypalService");
const { confirmBookingPayment } = require("./bookingService");

/**
 * PAYMENT_STATUS constants missing hone par fallback values.
 * Recommended bookingConstants:
 *
 * PAYMENT_STATUS = {
 *   PENDING: "pending",
 *   UNPAID: "unpaid",
 *   COMPLETED: "completed",
 *   FAILED: "failed",
 *   REFUNDED: "refunded",
 * }
 */
const STATUS = {
  PENDING: PAYMENT_STATUS?.PENDING || "pending",
  UNPAID: PAYMENT_STATUS?.UNPAID || "unpaid",
  COMPLETED: PAYMENT_STATUS?.COMPLETED || "completed",
  FAILED: PAYMENT_STATUS?.FAILED || "failed",
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeCurrency = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(amount.toFixed(2));
};

const amountsMatch = (firstAmount, secondAmount) => {
  const first = normalizeAmount(firstAmount);
  const second = normalizeAmount(secondAmount);

  return Math.abs(first - second) < 0.001;
};

const getApprovalLink = (order) => {
  const links = Array.isArray(order?.links) ? order.links : [];

  return (
    links.find((link) =>
      ["approve", "payer-action", "checkout"].includes(link?.rel)
    )?.href ||
    links.find((link) => Boolean(link?.href))?.href ||
    ""
  );
};

const getCapturedPayment = (capture) =>
  capture?.purchase_units?.[0]?.payments?.captures?.[0] || null;

const getPayableBookingStatuses = () =>
  new Set([
    normalizeStatus(STATUS.PENDING),
    normalizeStatus(STATUS.UNPAID),
    normalizeStatus(STATUS.FAILED),
    "pending",
    "unpaid",
    "failed",
  ]);

const isBookingPayable = (booking) => {
  const paymentStatus = normalizeStatus(booking?.paymentStatus);

  return getPayableBookingStatuses().has(paymentStatus);
};

const validateBookingAmount = (booking) => {
  const finalAmount = normalizeAmount(booking?.finalAmount);
  const currency = normalizeCurrency(booking?.currency);

  if (finalAmount <= 0) {
    throw new AppError("Invalid booking amount", 400, "INVALID_BOOKING_AMOUNT");
  }

  if (!currency) {
    throw new AppError(
      "Booking currency is required",
      400,
      "BOOKING_CURRENCY_REQUIRED"
    );
  }

  return {
    finalAmount,
    currency,
  };
};

const createBookingPayPalOrder = async ({
  bookingId,
  authUserId,
  returnUrl = "",
  cancelUrl = "",
}) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    userId: authUserId,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  const bookingPaymentStatus = normalizeStatus(booking.paymentStatus);

  /*
   * Booking already paid/completed hai.
   */
  if (
    bookingPaymentStatus === normalizeStatus(STATUS.COMPLETED) ||
    bookingPaymentStatus === "paid" ||
    bookingPaymentStatus === "completed"
  ) {
    const completedPayment = await Payment.findOne({
      bookingId: booking._id,
      gateway: "paypal",
      status: STATUS.COMPLETED,
    });

    return {
      booking,
      payment: completedPayment,
      alreadyCaptured: true,
    };
  }

  /*
   * Pending, unpaid ya failed booking par payment retry allowed hai.
   */
  if (!isBookingPayable(booking)) {
    throw new AppError(
      `Booking is not payable. Current payment status: ${
        booking.paymentStatus || "empty"
      }`,
      409,
      "BOOKING_NOT_PAYABLE"
    );
  }

  const { finalAmount, currency } = validateBookingAmount(booking);

  let payment = await Payment.findOne({
    bookingId: booking._id,
    gateway: "paypal",
  });

  if (normalizeStatus(payment?.status) === normalizeStatus(STATUS.COMPLETED)) {
    return {
      booking,
      payment,
      alreadyCaptured: true,
    };
  }

  /*
   * Existing PayPal order active hai to same approval URL reuse karenge.
   * Isse repeated clicks par unnecessary PayPal orders nahi banenge.
   */
  const existingApprovalUrl = payment?.meta?.approvalUrl || "";

  if (
    payment?.orderId &&
    existingApprovalUrl &&
    normalizeStatus(payment.status) === normalizeStatus(STATUS.PENDING)
  ) {
    return {
      booking,
      payment,
      orderId: payment.orderId,
      approvalUrl: existingApprovalUrl,
      reusedOrder: true,
    };
  }

  if (!payment) {
    payment = new Payment({
      user: authUserId,
      bookingId: booking._id,
      amount: finalAmount,
      expectedAmount: finalAmount,
      currency,
      purpose: "booking",
      status: STATUS.PENDING,
      gateway: "paypal",
      platformCommissionAmount: 0,
      gatewayFee: 0,
      idempotencyKey: `paypal-booking:${booking._id.toString()}`,
      meta: {
        bookingId: String(booking._id),
      },
    });
  } else {
    payment.user = authUserId;
    payment.amount = finalAmount;
    payment.expectedAmount = finalAmount;
    payment.currency = currency;
    payment.status = STATUS.PENDING;
  }

  let order;

  try {
    order = await createPayPalOrder({
      amount: finalAmount,
      currency,
      referenceId: booking.bookingNumber || String(booking._id),
      returnUrl,
      cancelUrl,
    });
  } catch (error) {
    payment.status = STATUS.FAILED;
    payment.meta = {
      ...(payment.meta || {}),
      bookingId: String(booking._id),
      orderCreateError: error?.message || "Unknown PayPal error",
      failedAt: new Date(),
    };

    await payment.save();

    throw error;
  }

  const approvalUrl = getApprovalLink(order);

  if (!order?.id || !approvalUrl) {
    payment.status = STATUS.FAILED;
    payment.rawGatewayResponse = order || null;
    payment.meta = {
      ...(payment.meta || {}),
      bookingId: String(booking._id),
      orderStatus: order?.status || "",
      failureReason: "PayPal approval URL or order ID missing",
      failedAt: new Date(),
    };

    await payment.save();

    throw new AppError(
      "PayPal order creation failed",
      502,
      "PAYPAL_ORDER_CREATE_FAILED"
    );
  }

  payment.orderId = order.id;
  payment.status = STATUS.PENDING;
  payment.rawGatewayResponse = order;
  payment.meta = {
    ...(payment.meta || {}),
    bookingId: String(booking._id),
    approvalUrl,
    returnUrl,
    cancelUrl,
    orderStatus: order.status,
    orderCreatedAt: new Date(),
  };

  await payment.save();

  /*
   * Booking me unpaid ho to pending mark kar sakte ho.
   * Schema enum me "pending" hona zaroori hai.
   */
  if (
    normalizeStatus(booking.paymentStatus) !== normalizeStatus(STATUS.PENDING)
  ) {
    booking.paymentStatus = STATUS.PENDING;
    await booking.save();
  }

  return {
    booking,
    payment,
    orderId: order.id,
    approvalUrl,
    order,
    reusedOrder: false,
  };
};

const captureBookingPayPalOrder = async ({
  bookingId,
  paypalOrderId,
  payerId = "",
  authUserId,
}) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    userId: authUserId,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  const payment = await Payment.findOne({
    bookingId: booking._id,
    gateway: "paypal",
  });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (normalizeStatus(payment.status) === normalizeStatus(STATUS.COMPLETED)) {
    if (
      normalizeStatus(booking.paymentStatus) !==
        normalizeStatus(STATUS.COMPLETED) ||
      normalizeStatus(booking.bookingStatus) !== "confirmed"
    ) {
      const result = await confirmBookingPayment({
        bookingId: booking._id,
        paymentMethod: "paypal",
        paymentRecord: payment,
        gatewayResponse: payment.rawGatewayResponse || {},
      });

      return {
        booking: result.booking,
        payment,
        chat: result.chat || null,
        alreadyCaptured: true,
      };
    }

    return {
      booking,
      payment,
      alreadyCaptured: true,
    };
  }

  if (!paypalOrderId) {
    throw new AppError(
      "PayPal order ID is required",
      400,
      "PAYPAL_ORDER_ID_REQUIRED"
    );
  }

  /*
   * Client kisi dusre orderId ko capture na kar sake.
   */
  if (payment.orderId && String(payment.orderId) !== String(paypalOrderId)) {
    throw new AppError(
      "PayPal order ID does not match this booking",
      400,
      "PAYPAL_ORDER_ID_MISMATCH"
    );
  }

  let capture;

  try {
    capture = await capturePayPalOrder({
      orderId: paypalOrderId,
      payerId,
    });
  } catch (error) {
    payment.status = STATUS.FAILED;
    payment.meta = {
      ...(payment.meta || {}),
      captureError: error?.message || "PayPal capture failed",
      captureFailedAt: new Date(),
    };

    await payment.save();

    throw error;
  }

  const captured = getCapturedPayment(capture);

  if (!captured) {
    payment.status = STATUS.FAILED;
    payment.rawGatewayResponse = capture;
    payment.meta = {
      ...(payment.meta || {}),
      capture,
      captureFailureReason: "Capture data not found",
      captureFailedAt: new Date(),
    };

    await payment.save();

    throw new AppError(
      "PayPal capture details not found",
      400,
      "PAYPAL_CAPTURE_DETAILS_NOT_FOUND"
    );
  }

  const captureStatus = normalizeStatus(captured.status);
  const capturedAmount = normalizeAmount(captured?.amount?.value);
  const capturedCurrency = normalizeCurrency(captured?.amount?.currency_code);

  const bookingAmount = normalizeAmount(booking.finalAmount);
  const bookingCurrency = normalizeCurrency(booking.currency);

  if (captureStatus !== normalizeStatus(STATUS.COMPLETED)) {
    payment.status = STATUS.FAILED;
    payment.rawGatewayResponse = capture;
    payment.meta = {
      ...(payment.meta || {}),
      capture,
      captureStatus: captured?.status || "",
      captureFailedAt: new Date(),
    };

    await payment.save();

    throw new AppError(
      `PayPal capture not completed. Current status: ${
        captured?.status || "unknown"
      }`,
      400,
      "PAYPAL_CAPTURE_NOT_COMPLETED"
    );
  }

  if (
    !amountsMatch(capturedAmount, bookingAmount) ||
    capturedCurrency !== bookingCurrency
  ) {
    payment.status = STATUS.FAILED;
    payment.rawGatewayResponse = capture;
    payment.meta = {
      ...(payment.meta || {}),
      capture,
      expectedAmount: bookingAmount,
      capturedAmount,
      expectedCurrency: bookingCurrency,
      capturedCurrency,
      captureFailedAt: new Date(),
    };

    await payment.save();

    throw new AppError(
      "Captured amount or currency mismatch",
      400,
      "PAYPAL_AMOUNT_MISMATCH"
    );
  }

  payment.paymentId = captured?.id || capture?.id || "";

  payment.gatewayCaptureId = captured?.id || capture?.id || "";

  payment.orderId = paypalOrderId;
  payment.status = STATUS.COMPLETED;
  payment.amount = capturedAmount;
  payment.currency = capturedCurrency;
  payment.rawGatewayResponse = capture;

  payment.meta = {
    ...(payment.meta || {}),
    capture,
    captureStatus: captured.status,
    capturedAt: new Date(),
    payerId,
  };

  await payment.save();

  /*
   * Ye service booking ko confirmed/paid karegi,
   * slot lock ko converted karegi aur chat/session create karegi.
   */
  const result = await confirmBookingPayment({
    bookingId: booking._id,
    paymentMethod: "paypal",
    paymentRecord: payment,
    gatewayResponse: capture,
  });

  return {
    booking: result.booking,
    payment,
    capture,
    chat: result.chat || null,
    alreadyCaptured: false,
  };
};

module.exports = {
  createBookingPayPalOrder,
  captureBookingPayPalOrder,
};
