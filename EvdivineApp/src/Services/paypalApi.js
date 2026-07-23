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

export const createPayPalOrder = async ({
  amount,
  currency = "USD",
  purpose = "wallet_recharge",
  meta = {},
  referenceId = "",
  returnUrl = "",
  cancelUrl = "",
  authToken = "",
}) => {
  const response = await requestJson("/api/paypal/orders", {
    method: "POST",
    authToken,
    body: {
      amount,
      currency,
      purpose,
      meta,
      referenceId,
      returnUrl,
      cancelUrl,
    },
  });

  return response;
};

export const capturePayPalOrder = async ({
  orderId,
  payerId = "",
  authToken = "",
}) => {
  const response = await requestJson(`/api/paypal/orders/${orderId}/capture`, {
    method: "POST",
    authToken,
    body: {
      payerId,
    },
  });

  return response;
};
