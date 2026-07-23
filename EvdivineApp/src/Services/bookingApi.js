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

const toDateKey = (date) => {
  const safeDate = date instanceof Date ? date : new Date(date);
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const fetchAvailableSlots = async ({ date, planId, authToken = "" }) => {
  const response = await requestJson(
    `/api/users/chat-booking/available-slots?date=${encodeURIComponent(
      toDateKey(date)
    )}&planId=${encodeURIComponent(planId)}`,
    { authToken }
  );

  return response;
};

export const fetchChatSlotPlans = async ({ authToken = "" }) => {
  return requestJson("/api/users/chat-booking/slot-plans", {
    authToken,
  });
};

export const lockBookingSlot = async ({
  slotPlanId,
  startAt,
  timeZone = "",
  authToken = "",
}) => {
  return requestJson("/api/users/chat-booking/lock-slot", {
    method: "POST",
    authToken,
    body: {
      slotPlanId,
      startAt,
      timeZone,
    },
  });
};

export const createPendingBooking = async ({
  lockId,
  paymentMethod,
  authToken = "",
}) => {
  return requestJson("/api/users/chat-booking/create", {
    method: "POST",
    authToken,
    body: {
      lockId,
      paymentMethod,
    },
  });
};

export const payBookingFromWallet = async ({ bookingId, authToken = "" }) => {
  return requestJson("/api/users/payments/pay-from-wallet", {
    method: "POST",
    authToken,
    body: {
      bookingId,
    },
  });
};

export const createBookingPayPalOrder = async ({
  bookingId,
  returnUrl = "",
  cancelUrl = "",
  authToken = "",
}) => {
  return requestJson("/api/users/payments/paypal/create-order", {
    method: "POST",
    authToken,
    body: {
      bookingId,
      returnUrl,
      cancelUrl,
    },
  });
};

export const captureBookingPayPalOrder = async ({
  bookingId,
  paypalOrderId,
  payerId = "",
  authToken = "",
}) => {
  return requestJson("/api/users/payments/paypal/capture", {
    method: "POST",
    authToken,
    body: {
      bookingId,
      paypalOrderId,
      payerId,
    },
  });
};

export const listMyBookings = async ({
  page = 1,
  limit = 20,
  filter = "",
  authToken = "",
}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filter) {
    params.set("filter", filter);
  }

  return requestJson(`/api/users/bookings?${params.toString()}`, {
    authToken,
  });
};

export const getMyBooking = async ({ bookingId, authToken = "" }) => {
  return requestJson(`/api/users/bookings/${encodeURIComponent(bookingId)}`, {
    authToken,
  });
};

export const cancelMyBooking = async ({
  bookingId,
  reason = "",
  authToken = "",
}) => {
  return requestJson(
    `/api/users/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "POST",
      authToken,
      body: { reason },
    }
  );
};
