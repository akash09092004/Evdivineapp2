const User = require("../../models/user/User");
const WalletTransaction = require("../../models/common/WalletTransaction");
const Invoice = require("../../models/common/Invoice");
const RechargePlan = require("../../models/common/RechargePlan");
const Payment = require("../../models/common/Payment");
const { createInvoice } = require("../../services/invoiceService");
const {
  createOrder,
  verifyPaymentSignature,
  capturePaymentRecord,
} = require("../../services/paymentService");
const {
  createPayPalOrder,
  capturePayPalOrder,
} = require("../../services/paypalService");
const { creditWallet } = require("../../services/walletService");
const { initiateRefund } = require("../../services/refundService");
const { getLowWalletAlertThreshold } = require("../../services/configService");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendResponse } = require("../../utils/responseHandler");
const AppError = require("../../utils/AppError");
const { PAYMENT_STATUS } = require("../../utils/constants");
const { isValidObjectId } = require("mongoose");

const MIN_CUSTOM_RECHARGE_AMOUNT = Number(
  process.env.MIN_RECHARGE_AMOUNT || 100
);
const WALLET_PAYPAL_CURRENCY = String(
  process.env.WALLET_PAYPAL_CURRENCY || process.env.PAYPAL_CURRENCY || "USD"
)
  .trim()
  .toUpperCase();

const normalizePaymentStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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

const getBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.id).lean();
  const balance = Number(user?.walletBalance || 0);
  const threshold = await getLowWalletAlertThreshold();
  sendResponse(res, {
    data: {
      balance,
      lowWalletAlertThreshold: threshold,
      isLowBalance: balance <= threshold,
    },
  });
});

const getPlans = asyncHandler(async (req, res) => {
  const plans = await RechargePlan.find({ isActive: true })
    .sort({ amount: 1 })
    .lean();
  sendResponse(res, { data: plans });
});

const createRechargeOrder = asyncHandler(async (req, res) => {
  const { amount, planId } = req.body;

  let rechargeAmount;
  let selectedPlan = null;

  if (planId) {
    if (!isValidObjectId(planId)) {
      throw new AppError(
        "Recharge plan not found",
        404,
        "RECHARGE_PLAN_NOT_FOUND"
      );
    }

    selectedPlan = await RechargePlan.findById(planId).lean();
    if (!selectedPlan) {
      throw new AppError(
        "Recharge plan not found",
        404,
        "RECHARGE_PLAN_NOT_FOUND"
      );
    }

    if (!selectedPlan.isActive) {
      throw new AppError(
        "Recharge plan is inactive",
        400,
        "RECHARGE_PLAN_INACTIVE"
      );
    }

    rechargeAmount = Number(selectedPlan.amount);
  } else {
    rechargeAmount = Number(amount);
    if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      throw new AppError("amount is required", 400, "VALIDATION_ERROR");
    }
    if (rechargeAmount < MIN_CUSTOM_RECHARGE_AMOUNT) {
      throw new AppError(
        `Minimum recharge amount is ${MIN_CUSTOM_RECHARGE_AMOUNT}`,
        400,
        "MIN_RECHARGE_AMOUNT"
      );
    }
  }

  const order = await createOrder({
    amount: rechargeAmount,
    receipt: `wallet_${req.auth.id}_${Date.now()}`,
    notes: {
      userId: req.auth.id,
      planId: planId || "",
      rechargeType: selectedPlan ? "plan" : "custom",
      expectedAmount: rechargeAmount,
    },
  });

  await Payment.create({
    user: req.auth.id,
    amount: rechargeAmount,
    expectedAmount: rechargeAmount,
    planId: planId || null,
    purpose: "wallet_recharge",
    orderId: order.id,
    status: PAYMENT_STATUS.PENDING,
    meta: {
      planId: planId || "",
      rechargeType: selectedPlan ? "plan" : "custom",
      expectedAmount: rechargeAmount,
    },
  });

  sendResponse(res, { message: "Recharge order created", data: order });
});

const createPaypalRechargeOrder = asyncHandler(async (req, res) => {
  const {
    amount,
    planId,
    returnUrl = "",
    cancelUrl = "",
    currency,
    purpose = "wallet_recharge",
    meta = {},
    referenceId = "",
  } = req.body;

  let rechargeAmount;
  let selectedPlan = null;

  if (planId) {
    if (!isValidObjectId(planId)) {
      throw new AppError(
        "Recharge plan not found",
        404,
        "RECHARGE_PLAN_NOT_FOUND"
      );
    }

    selectedPlan = await RechargePlan.findById(planId).lean();
    if (!selectedPlan) {
      throw new AppError(
        "Recharge plan not found",
        404,
        "RECHARGE_PLAN_NOT_FOUND"
      );
    }

    if (!selectedPlan.isActive) {
      throw new AppError(
        "Recharge plan is inactive",
        400,
        "RECHARGE_PLAN_INACTIVE"
      );
    }

    rechargeAmount = Number(selectedPlan.amount);
  } else {
    rechargeAmount = Number(amount);

    if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      throw new AppError("amount is required", 400, "VALIDATION_ERROR");
    }

    if (rechargeAmount < MIN_CUSTOM_RECHARGE_AMOUNT) {
      throw new AppError(
        `Minimum recharge amount is ${MIN_CUSTOM_RECHARGE_AMOUNT}`,
        400,
        "MIN_RECHARGE_AMOUNT"
      );
    }
  }

  const paymentCurrency = String(currency || WALLET_PAYPAL_CURRENCY)
    .trim()
    .toUpperCase();
  const paymentReferenceId =
    referenceId || `wallet_${req.auth.id}_${Date.now()}`;

  const payment = await Payment.create({
    user: req.auth.id,
    amount: rechargeAmount,
    expectedAmount: rechargeAmount,
    currency: paymentCurrency,
    purpose:
      purpose === "wallet_recharge" ? "wallet_recharge" : "wallet_recharge",
    status: PAYMENT_STATUS.PENDING,
    gateway: "paypal",
    orderId: "",
    paymentId: "",
    meta: {
      ...meta,
      planId: planId || "",
      rechargeType: selectedPlan ? "plan" : "custom",
      gateway: "paypal",
      paymentAmount: rechargeAmount,
      paymentCurrency,
      referenceId: paymentReferenceId,
    },
  });

  try {
    const order = await createPayPalOrder({
      amount: rechargeAmount,
      currency: paymentCurrency,
      referenceId: paymentReferenceId,
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

    const approvalUrl = getApprovalLink(order);

    if (!approvalUrl) {
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
      approvalUrl,
      returnUrl,
      cancelUrl,
      orderStatus: order.status,
    };

    await payment.save();

    return sendResponse(res, {
      statusCode: 201,
      message: "Wallet PayPal recharge order created",
      data: {
        orderId: order.id,
        status: order.status,
        approvalUrl,
        amount: rechargeAmount,
        currency: paymentCurrency,
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

const capturePaypalRechargeOrder = asyncHandler(async (req, res) => {
  const orderId = String(req.params.orderId || req.body.orderId || "").trim();
  const payerId = String(req.body.payerId || req.body.PayerID || "").trim();

  if (!orderId) {
    throw new AppError(
      "PayPal order ID is required",
      400,
      "PAYPAL_ORDER_ID_REQUIRED"
    );
  }

  const payment = await Payment.findOne({
    orderId,
    user: req.auth.id,
    purpose: "wallet_recharge",
    gateway: "paypal",
  });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (
    [PAYMENT_STATUS.PAID, PAYMENT_STATUS.COMPLETED].includes(
      normalizePaymentStatus(payment.status)
    )
  ) {
    return sendResponse(res, {
      statusCode: 200,
      message: "PayPal wallet payment already captured",
      data: {
        payment,
        alreadyCaptured: true,
      },
    });
  }

  const capture = await capturePayPalOrder({ orderId, payerId });
  const captureStatus = String(
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status ||
      capture?.status ||
      ""
  ).toUpperCase();
  const paymentId =
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.invoice_id ||
    capture?.id ||
    "";

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

  const capturedAmount = Number(
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0
  );
  const capturedCurrency = String(
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount
      ?.currency_code || ""
  )
    .trim()
    .toUpperCase();
  const expectedAmount = Number(payment.expectedAmount || payment.amount || 0);
  const expectedCurrency = String(payment.currency || WALLET_PAYPAL_CURRENCY)
    .trim()
    .toUpperCase();

  const amountMatches =
    Number.isFinite(capturedAmount) &&
    Math.abs(capturedAmount - expectedAmount) <= 0.01;
  const currencyMatches = capturedCurrency === expectedCurrency;

  if (!amountMatches || !currencyMatches) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.paymentId = paymentId;
    payment.meta = {
      ...payment.meta,
      capture,
      amountMismatch: true,
      expectedAmount,
      expectedCurrency,
      capturedAmount,
      capturedCurrency,
    };
    await payment.save();

    throw new AppError(
      "Captured PayPal amount or currency does not match",
      400,
      "PAYPAL_CAPTURE_AMOUNT_MISMATCH"
    );
  }

  payment.paymentId = paymentId;
  payment.gatewayCaptureId = paymentId;
  payment.status = PAYMENT_STATUS.COMPLETED;
  payment.meta = {
    ...payment.meta,
    capture,
    captureStatus,
    capturedAmount,
    capturedCurrency,
    capturedAt: new Date(),
    payerId,
  };
  await payment.save();

  await creditWallet({
    ownerType: "user",
    ownerId: req.auth.id,
    amount: expectedAmount,
    type: "wallet_recharge",
    reference: payment._id.toString(),
    meta: {
      gateway: "paypal",
      currency: expectedCurrency,
      orderId,
      paymentId,
    },
  });

  await createInvoice({
    userId: req.auth.id,
    paymentId: payment._id,
    amount: expectedAmount,
    gstPercent: Number(process.env.GST_PERCENT || 0),
    metadata: {
      purpose: "wallet_recharge",
      gateway: "paypal",
      currency: expectedCurrency,
      orderId,
      paymentId,
      planId: payment.planId || null,
    },
  });

  sendResponse(res, {
    message: "Wallet recharged via PayPal",
    data: {
      success: true,
      status: PAYMENT_STATUS.COMPLETED,
      payment,
      orderId,
      paymentId,
      amount: expectedAmount,
      currency: expectedCurrency,
      capture,
    },
  });
});

const verifyRecharge = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, amount } = req.body;
  if (!verifyPaymentSignature({ orderId, paymentId, signature }))
    throw new AppError(
      "Invalid payment signature",
      400,
      "PAYMENT_SIGNATURE_INVALID"
    );
  const payment = await Payment.findOne({
    orderId,
    user: req.auth.id,
    purpose: "wallet_recharge",
  });
  if (!payment)
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");

  const verifiedAmount = Number(amount);
  const expectedAmount = Number(payment.expectedAmount || payment.amount || 0);
  if (!Number.isFinite(verifiedAmount) || verifiedAmount <= 0) {
    throw new AppError("amount is required", 400, "VALIDATION_ERROR");
  }

  if (verifiedAmount !== expectedAmount) {
    throw new AppError("Amount mismatch", 400, "AMOUNT_MISMATCH");
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id },
    { paymentId, signature, status: PAYMENT_STATUS.COMPLETED },
    { new: true }
  );

  await creditWallet({
    ownerType: "user",
    ownerId: req.auth.id,
    amount: expectedAmount,
    type: "wallet_recharge",
    reference: updatedPayment._id.toString(),
  });

  await createInvoice({
    userId: req.auth.id,
    paymentId: updatedPayment._id,
    amount: expectedAmount,
    gstPercent: Number(process.env.GST_PERCENT || 18),
    metadata: {
      purpose: "wallet_recharge",
      planId: updatedPayment.planId || null,
    },
  });

  sendResponse(res, { message: "Wallet recharged", data: updatedPayment });
});

const transactions = asyncHandler(async (req, res) => {
  const tx = await WalletTransaction.find({
    ownerType: "user",
    owner: req.auth.id,
  })
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, { data: tx });
});

const requestRefund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason = "" } = req.body;
  if (!paymentId)
    throw new AppError("paymentId is required", 400, "PAYMENT_ID_REQUIRED");
  const payment = await Payment.findOne({ _id: paymentId, user: req.auth.id });
  if (!payment)
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  const refund = await initiateRefund({
    userId: req.auth.id,
    amount: Number(amount || payment.amount || 0),
    paymentId: payment._id.toString(),
    reason,
  });
  sendResponse(res, { message: "Refund requested", data: refund });
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    user: req.auth.id,
  }).lean();
  if (!invoice)
    throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  sendResponse(res, { data: invoice });
});

module.exports = {
  getBalance,
  getPlans,
  createRechargeOrder,
  verifyRecharge,
  createPaypalRechargeOrder,
  capturePaypalRechargeOrder,
  transactions,
  requestRefund,
  getInvoiceById,
};
