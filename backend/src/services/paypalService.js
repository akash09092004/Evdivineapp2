const axios = require("axios");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

const getPayPalEnvironment = () =>
  String(process.env.PAYPAL_ENV || "sandbox").toLowerCase();

const getPayPalBaseUrl = () => {
  if (process.env.PAYPAL_API_BASE_URL) {
    return process.env.PAYPAL_API_BASE_URL.replace(/\/$/, "");
  }

  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

const validatePayPalConfig = () => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    throw new AppError(
      "PAYPAL_CLIENT_ID is missing",
      500,
      "PAYPAL_CONFIG_MISSING"
    );
  }

  if (!process.env.PAYPAL_CLIENT_SECRET) {
    throw new AppError(
      "PAYPAL_CLIENT_SECRET is missing",
      500,
      "PAYPAL_CONFIG_MISSING"
    );
  }
};

const toPayPalError = (error, fallbackMessage, fallbackCode) => {
  const responseData = error.response?.data;
  const firstIssue = responseData?.details?.[0]?.issue;
  const firstDescription = responseData?.details?.[0]?.description;

  const message =
    responseData?.message ||
    responseData?.error_description ||
    firstDescription ||
    error.message ||
    fallbackMessage;

  const code =
    firstIssue === "ORDER_NOT_APPROVED"
      ? "PAYPAL_ORDER_NOT_APPROVED"
      : fallbackCode;

  return new AppError(
    message,
    error.response?.status || 500,
    code,
    responseData || error.message
  );
};

const normalizeAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError(
      "Valid amount is required",
      400,
      "PAYPAL_AMOUNT_INVALID"
    );
  }

  return numericAmount.toFixed(2);
};

const normalizeCurrency = (currency) => {
  const value = String(currency || process.env.PAYPAL_CURRENCY || "USD")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(value)) {
    throw new AppError(
      "Valid currency code is required",
      400,
      "PAYPAL_CURRENCY_INVALID"
    );
  }

  return value;
};

const getPayPalAccessToken = async () => {
  validatePayPalConfig();

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.post(
      `${getPayPalBaseUrl()}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      }
    );

    if (!response.data?.access_token) {
      throw new AppError(
        "PayPal access token was not returned",
        502,
        "PAYPAL_TOKEN_MISSING"
      );
    }

    return response.data.access_token;
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw toPayPalError(
      error,
      "Unable to authenticate with PayPal",
      "PAYPAL_AUTH_FAILED"
    );
  }
};

const createPayPalOrder = async ({
  amount,
  currency = "USD",
  referenceId,
  returnUrl,
  cancelUrl,
}) => {
  const accessToken = await getPayPalAccessToken();
  const normalizedAmount = normalizeAmount(amount);
  const normalizedCurrency = normalizeCurrency(currency);

  try {
    const response = await axios.post(
      `${getPayPalBaseUrl()}/v2/checkout/orders`,
      {
        intent: "CAPTURE",

        purchase_units: [
          {
            reference_id: referenceId || `evdivine-${crypto.randomUUID()}`,

            amount: {
              currency_code: normalizedCurrency,
              value: normalizedAmount,
            },
          },
        ],

        application_context: {
          brand_name: process.env.APP_NAME || "Evdivine",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: String(
            returnUrl ||
              process.env.PAYPAL_RETURN_URL ||
              "evdivineapp://paypal-success"
          ).trim(),
          cancel_url: String(
            cancelUrl ||
              process.env.PAYPAL_CANCEL_URL ||
              "evdivineapp://paypal-cancel"
          ).trim(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `order-${crypto.randomUUID()}`,
          Prefer: "return=representation",
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    throw toPayPalError(
      error,
      "Unable to create PayPal order",
      "PAYPAL_ORDER_CREATE_FAILED"
    );
  }
};

const capturePayPalOrder = async (input) => {
  const normalizedOrderId = String(
    typeof input === "object" && input !== null ? input.orderId : input || ""
  ).trim();

  if (!normalizedOrderId) {
    throw new AppError(
      "PayPal order ID is required",
      400,
      "PAYPAL_ORDER_ID_REQUIRED"
    );
  }

  const accessToken = await getPayPalAccessToken();

  try {
    const response = await axios.post(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(
        normalizedOrderId
      )}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `capture-${normalizedOrderId}-${crypto.randomUUID()}`,
          Prefer: "return=representation",
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    throw toPayPalError(
      error,
      "Unable to capture PayPal order",
      "PAYPAL_ORDER_CAPTURE_FAILED"
    );
  }
};

module.exports = {
  getPayPalAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
};
