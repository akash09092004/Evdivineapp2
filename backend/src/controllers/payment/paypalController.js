const {
  getPayPalAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
} = require("../../services/paypalService");

const { asyncHandler } = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/responseHandler");
const AppError = require("../../utils/AppError");

const Payment = require("../../models/common/Payment");
const { PAYMENT_STATUS } = require("../../utils/constants");

const { createInvoice } = require("../../services/invoiceService");
const { creditWallet } = require("../../services/walletService");

const DEFAULT_PURPOSE = "wallet_recharge";
const PAYPAL_CURRENCY = "USD";

const getPurchaseUnitCapture = (capture) =>
  capture?.purchase_units?.[0]?.payments?.captures?.[0] || null;

const getPurchaseUnitCaptureId = (capture) =>
  getPurchaseUnitCapture(capture)?.id ||
  getPurchaseUnitCapture(capture)?.invoice_id ||
  capture?.id ||
  "";

const getCaptureStatus = (capture) =>
  getPurchaseUnitCapture(capture)?.status || capture?.status || "";

const getCapturedAmountDetails = (capture) => {
  const amountData = getPurchaseUnitCapture(capture)?.amount;

  return {
    amount: Number(amountData?.value || 0),
    currency: String(amountData?.currency_code || "")
      .trim()
      .toUpperCase(),
  };
};

const getApprovalLink = (order) => {
  const links = Array.isArray(order?.links) ? order.links : [];

  return (
    links.find((link) =>
      ["approve", "payer-action", "checkout"].includes(link?.rel)
    )?.href ||
    links.find((link) => /paypal/i.test(String(link?.href || "")))?.href ||
    links.find((link) => Boolean(link?.href))?.href ||
    ""
  );
};

const normalizeAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError(
      "Valid USD amount is required",
      400,
      "PAYPAL_AMOUNT_INVALID"
    );
  }

  return Number(numericAmount.toFixed(2));
};

const testPayPalConnection = asyncHandler(async (req, res) => {
  await getPayPalAccessToken();

  return res.status(200).json({
    success: true,
    message: "PayPal sandbox connected successfully",
    environment: process.env.PAYPAL_ENV || "sandbox",
    currency: PAYPAL_CURRENCY,
  });
});

const createOrder = asyncHandler(async (req, res) => {
  const {
    amount,
    purpose = DEFAULT_PURPOSE,
    meta = {},
    referenceId = "",
    returnUrl = "",
    cancelUrl = "",
  } = req.body;

  const paymentAmount = normalizeAmount(amount);

  /*
   * Currency frontend se nahi li jayegi.
   * PayPal order hamesha USD me create hoga.
   */
  const currency = PAYPAL_CURRENCY;

  const payment = await Payment.create({
    user: req.auth.id,
    amount: paymentAmount,
    expectedAmount: paymentAmount,
    currency,
    purpose,
    status: PAYMENT_STATUS.PENDING,
    gateway: "paypal",
    orderId: "",
    paymentId: "",
    meta: {
      ...meta,
      gateway: "paypal",
      paymentAmount,
      paymentCurrency: currency,
    },
  });

  try {
    console.log("PAYPAL CREATE ORDER:", {
      amount: paymentAmount,
      currency,
      environment: process.env.PAYPAL_ENV || "sandbox",
    });

    const order = await createPayPalOrder({
      amount: paymentAmount,
      currency,
      referenceId: referenceId || `paypal_${req.auth.id}_${Date.now()}`,
      returnUrl,
      cancelUrl,
    });

    if (!order?.id) {
      throw new AppError(
        "PayPal order ID was not returned",
        502,
        "PAYPAL_ORDER_ID_MISSING"
      );
    }

    const approvalLink = getApprovalLink(order);

    if (!approvalLink) {
      throw new AppError(
        "PayPal approval URL was not returned",
        502,
        "PAYPAL_APPROVAL_URL_MISSING"
      );
    }

    payment.orderId = order.id;

    payment.meta = {
      ...payment.meta,
      paypalOrderId: order.id,
      approvalUrl: approvalLink,
      returnUrl,
      cancelUrl,
      orderStatus: order.status,
    };

    await payment.save();

    return sendResponse(res, {
      statusCode: 201,
      message: "PayPal USD order created successfully",
      data: {
        orderId: order.id,
        status: order.status,
        approvalUrl: approvalLink,
        amount: paymentAmount,
        currency,
        payment,
      },
    });
  } catch (error) {
    payment.status = PAYMENT_STATUS.FAILED;

    payment.meta = {
      ...payment.meta,
      createOrderError: {
        message: error.message,
        code: error.code || "PAYPAL_ORDER_CREATE_FAILED",
      },
    };

    await payment.save();

    throw error;
  }
});

const captureOrder = asyncHandler(async (req, res) => {
  const orderId = String(req.params.orderId || req.body.orderId || "").trim();
  const payerId = String(req.body.payerId || req.body.PayerID || "").trim();

  if (!orderId) {
    throw new AppError(
      "PayPal order ID is required",
      400,
      "PAYPAL_ORDER_ID_REQUIRED"
    );
  }

  /*
   * PayPal API call se pehle apna DB record check karo.
   */
  const payment = await Payment.findOne({
    orderId,
    user: req.auth.id,
    gateway: "paypal",
  });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  /*
   * Same payment dobara credit nahi hogi.
   */
  if (payment.status === PAYMENT_STATUS.PAID) {
    return sendResponse(res, {
      statusCode: 200,
      message: "PayPal payment already captured",
      data: {
        payment,
        alreadyCaptured: true,
      },
    });
  }

  const capture = await capturePayPalOrder({
    orderId,
    payerId,
  });

  const captureStatus = String(getCaptureStatus(capture)).toUpperCase();

  const paymentId = getPurchaseUnitCaptureId(capture);

  if (captureStatus !== "COMPLETED") {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.paymentId = paymentId;

    payment.meta = {
      ...payment.meta,
      capture,
      captureStatus,
    };

    await payment.save();

    throw new AppError(
      `PayPal capture status: ${captureStatus || "unknown"}`,
      400,
      "PAYPAL_CAPTURE_NOT_COMPLETED"
    );
  }

  const captured = getCapturedAmountDetails(capture);

  const expectedAmount = Number(payment.expectedAmount || payment.amount || 0);

  const expectedCurrency = PAYPAL_CURRENCY;

  const amountMatches =
    Number.isFinite(captured.amount) &&
    Math.abs(captured.amount - expectedAmount) <= 0.01;

  const currencyMatches = captured.currency === expectedCurrency;

  if (!amountMatches || !currencyMatches) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.paymentId = paymentId;

    payment.meta = {
      ...payment.meta,
      capture,
      amountMismatch: true,
      expectedAmount,
      expectedCurrency,
      capturedAmount: captured.amount,
      capturedCurrency: captured.currency,
    };

    await payment.save();

    throw new AppError(
      "Captured PayPal amount or currency does not match",
      400,
      "PAYPAL_CAPTURE_AMOUNT_MISMATCH"
    );
  }

  payment.paymentId = paymentId;
  payment.status = PAYMENT_STATUS.PAID;

  payment.meta = {
    ...payment.meta,
    capture,
    captureStatus,
    capturedAmount: captured.amount,
    capturedCurrency: captured.currency,
    capturedAt: new Date(),
    payerId,
  };

  await payment.save();

  if (payment.purpose === DEFAULT_PURPOSE) {
    await creditWallet({
      ownerType: "user",
      ownerId: req.auth.id,
      amount: expectedAmount,
      type: "wallet_recharge",
      reference: payment._id.toString(),
      meta: {
        gateway: "paypal",
        currency: PAYPAL_CURRENCY,
        orderId,
        paymentId,
      },
    });
  }

  try {
    await createInvoice({
      userId: req.auth.id,
      paymentId: payment._id,
      amount: expectedAmount,
      currency: PAYPAL_CURRENCY,
      gstPercent: Number(process.env.GST_PERCENT || 0),
      metadata: {
        purpose: payment.purpose,
        gateway: "paypal",
        currency: PAYPAL_CURRENCY,
        orderId,
        paymentId,
      },
    });
  } catch (invoiceError) {
    payment.meta = {
      ...payment.meta,
      invoiceCreationFailed: true,
      invoiceError: invoiceError.message,
    };

    await payment.save();
  }

  return sendResponse(res, {
    statusCode: 200,
    message: "PayPal USD payment captured successfully",
    data: {
      orderId,
      paymentId,
      amount: expectedAmount,
      currency: PAYPAL_CURRENCY,
      capture,
      payment,
    },
  });
});

module.exports = {
  testPayPalConnection,
  createOrder,
  captureOrder,
};
