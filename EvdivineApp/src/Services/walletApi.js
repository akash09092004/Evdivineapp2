import { API_BASE_URL } from "../config/api";

const REQUEST_TIMEOUT_MS = 20000;

const buildHeaders = (authToken) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
};

const requestJson = async (
  path,
  { method = "GET", body, authToken = "" } = {}
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(authToken),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || `Request failed with status ${response.status}`
      );
      error.response = {
        status: response.status,
        data,
      };
      throw error;
    }

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Request timed out");
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getWalletBalance = async ({ authToken = "" }) =>
  requestJson("/api/users/wallet/balance", { authToken });

export const getWalletPlans = async ({ authToken = "" }) =>
  requestJson("/api/users/wallet/plans", { authToken });

export const getWalletTransactions = async ({ authToken = "" }) =>
  requestJson("/api/users/wallet/transactions", { authToken });

export const createWalletRechargeOrder = async ({
  amount,
  planId = "",
  authToken = "",
}) =>
  requestJson("/api/users/wallet/recharge/order", {
    method: "POST",
    authToken,
    body: {
      amount,
      planId,
    },
  });

export const verifyWalletRecharge = async ({
  orderId,
  paymentId,
  signature,
  amount,
  authToken = "",
}) =>
  requestJson("/api/users/wallet/recharge/verify", {
    method: "POST",
    authToken,
    body: {
      orderId,
      paymentId,
      signature,
      amount,
    },
  });

export const createWalletPayPalOrder = async ({
  amount,
  planId = "",
  currency = "USD",
  purpose = "wallet_recharge",
  meta = {},
  referenceId = "",
  returnUrl = "",
  cancelUrl = "",
  authToken = "",
}) =>
  requestJson("/api/users/wallet/paypal/recharge/order", {
    method: "POST",
    authToken,
    body: {
      amount,
      planId,
      currency,
      purpose,
      meta,
      referenceId,
      returnUrl,
      cancelUrl,
    },
  });

export const captureWalletPayPalOrder = async ({
  orderId,
  payerId = "",
  authToken = "",
}) =>
  requestJson(`/api/users/wallet/paypal/recharge/${orderId}/capture`, {
    method: "POST",
    authToken,
    body: {
      payerId,
    },
  });
