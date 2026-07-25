import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../context/AuthContext";
import { capturePayPalOrder, createPayPalOrder } from "../Services/paypalApi";

WebBrowser.maybeCompleteAuthSession();

const SUCCESS_PREFIX = "evdivineapp://paypal-success";
const CANCEL_PREFIX = "evdivineapp://paypal-cancel";
const PAYPAL_RETURN_PATH = "paypal-return";
const PENDING_ORDER_KEY = "paypalPendingOrderId";

const getBrowserRedirectUrl = (status) => {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.searchParams.set("paypal_status", status);
  url.searchParams.delete("paypal_token");
  return url.toString();
};

const getMobileRedirectUrl = () => ExpoLinking.createURL(PAYPAL_RETURN_PATH);

const isMobileReturnUrl = (url) => {
  if (!url) {
    return false;
  }

  const mobileRedirectUrl = getMobileRedirectUrl();

  return (
    url.startsWith(mobileRedirectUrl) ||
    url.includes(PAYPAL_RETURN_PATH) ||
    url.includes("paypal-return")
  );
};

const parsePayPalReturnUrl = (url) => {
  if (!url) {
    return { orderId: "", payerId: "", status: "" };
  }

  try {
    const parsedUrl = new URL(url);
    return {
      orderId:
        parsedUrl.searchParams.get("token") ||
        parsedUrl.searchParams.get("orderId") ||
        parsedUrl.searchParams.get("paypal_order_id") ||
        "",
      payerId:
        parsedUrl.searchParams.get("PayerID") ||
        parsedUrl.searchParams.get("payerId") ||
        parsedUrl.searchParams.get("payer_id") ||
        "",
      status: parsedUrl.searchParams.get("paypal_status") || "",
    };
  } catch {
    return { orderId: "", payerId: "", status: "" };
  }
};

const getApprovalUrl = (response) =>
  response?.data?.data?.approvalUrl ||
  response?.data?.data?.order?.links?.find((link) =>
    ["approve", "payer-action", "checkout"].includes(link?.rel)
  )?.href ||
  response?.data?.data?.order?.links?.find((link) => Boolean(link?.href))
    ?.href ||
  response?.data?.data?.order?.links?.[0]?.href ||
  response?.data?.approvalUrl ||
  response?.data?.order?.links?.find((link) => Boolean(link?.href))?.href ||
  response?.data?.order?.links?.[0]?.href ||
  "";
const getOrderId = (response) =>
  response?.data?.data?.orderId ||
  response?.data?.data?.order?.id ||
  response?.data?.data?.payment?.orderId ||
  response?.data?.orderId ||
  response?.data?.order?.id ||
  response?.data?.payment?.orderId ||
  "";
const getCaptureStatus = (response) =>
  response?.data?.status ||
  response?.data?.data?.status ||
  response?.data?.data?.payment?.status ||
  response?.data?.payment?.status ||
  response?.status ||
  "";

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const isSuccessfulStatus = (value) =>
  ["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED"].includes(
    normalizeStatus(value)
  );

const isPendingStatus = (value) =>
  ["PENDING", "PROCESSING", "CREATED"].includes(normalizeStatus(value));

const PayPalCheckoutButton = forwardRef(function PayPalCheckoutButton(
  {
    amount = 10,
    currency = "USD",
    purpose = "wallet_recharge",
    meta = {},
    referenceId = "",
    onPaymentSuccess,
    onPaymentError,
    buttonLabel,
    createOrderRequest,
    captureOrderRequest,
    showAlerts = true,
    onPaymentPending,
  },
  ref
) {
  const { authToken, authReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const pendingOrderIdRef = useRef(null);
  const handlingReturnRef = useRef(false);
  const authTokenRef = useRef(authToken);
  const authReadyRef = useRef(authReady);

  useEffect(() => {
    authTokenRef.current = authToken;
    authReadyRef.current = authReady;
  }, [authToken, authReady]);

  const clearPendingOrder = async () => {
    pendingOrderIdRef.current = null;
    try {
      await AsyncStorage.removeItem(PENDING_ORDER_KEY);
    } catch {}
  };

  const storePendingOrder = async (orderId) => {
    pendingOrderIdRef.current = orderId;
    try {
      await AsyncStorage.setItem(PENDING_ORDER_KEY, orderId);
    } catch {}
  };

  const notifyPaymentError = (error, fallbackMessage) => {
    onPaymentError?.(error);

    if (!showAlerts) {
      return;
    }

    Alert.alert(
      "Payment failed",
      error?.response?.data?.message ||
        (error?.response?.data?.code === "PAYPAL_ORDER_NOT_APPROVED"
          ? "PayPal order approve nahi hua. Pehle sandbox checkout page me Approve / Continue click karein."
          : "") ||
        error?.message ||
        fallbackMessage ||
        "PayPal payment complete nahi ho saka."
    );
  };

  const notifyPaymentCancelled = (
    message = "PayPal payment complete nahi hua."
  ) => {
    const error = new Error(message);
    error.code = "PAYPAL_PAYMENT_CANCELLED";
    onPaymentError?.(error);

    if (showAlerts) {
      Alert.alert("Payment cancelled", message);
    }
  };

  const isPaymentCancelledError = (error) =>
    error?.code === "PAYPAL_PAYMENT_CANCELLED" ||
    error?.name === "PAYPAL_PAYMENT_CANCELLED";

  const notifyPaymentPending = (response, fallbackMessage) => {
    onPaymentPending?.(response);

    if (!showAlerts) {
      return;
    }

    const status = String(getCaptureStatus(response) || "").toUpperCase();
    Alert.alert(
      "Payment pending",
      fallbackMessage ||
        `PayPal payment ${status || "PENDING"} state me hai. Thodi der baad status refresh karein.`
    );
  };

  const completeCapture = async ({ orderId, payerId = "" }) => {
    const captureArgs = {
      orderId,
      payerId,
      authToken: authTokenRef.current,
    };

    const captureResponse = captureOrderRequest
      ? await captureOrderRequest(captureArgs)
      : await capturePayPalOrder(captureArgs);
    const paymentStatus = getCaptureStatus(captureResponse);
    const normalizedStatus = normalizeStatus(paymentStatus);

    if (isPendingStatus(normalizedStatus)) {
      notifyPaymentPending(
        captureResponse,
        `PayPal payment ${normalizedStatus.toLowerCase()} hai. Ye automatically complete ho sakta hai.`
      );
      return;
    }

    if (!isSuccessfulStatus(normalizedStatus)) {
      throw new Error(`PayPal capture status: ${paymentStatus || "unknown"}`);
    }

    onPaymentSuccess?.(captureResponse);

    if (showAlerts) {
      Alert.alert(
        "Payment successful",
        `${Number(amount).toFixed(
          2
        )} ${currency} payment completed successfully.`
      );
    }
  };

  const finishUrlFlow = async () => {
    handlingReturnRef.current = false;
    setLoading(false);
    await clearPendingOrder();
  };

  const handlePayPalReturn = async (url) => {
    if (!url) {
      return false;
    }

    return handleRedirectUrl(url);
  };

  const openPayPalCheckout = async (approvalUrl, redirectUrl) => {
    if (!approvalUrl) {
      throw new Error("PayPal approval URL missing");
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(approvalUrl);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      approvalUrl,
      redirectUrl || SUCCESS_PREFIX
    );

    if (result.type === "success" && result.url) {
      await handlePayPalReturn(result.url);
      return;
    }

    if (result.type === "cancel" || result.type === "dismiss") {
      notifyPaymentCancelled("PayPal payment complete nahi hua.");
      return;
    }
  };

  const handleBrowserReturn = async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return false;
    }

    if (!authReadyRef.current || !authTokenRef.current) {
      return false;
    }

    const currentUrl = new URL(window.location.href);
    const {
      orderId: urlOrderId,
      payerId,
      status,
    } = parsePayPalReturnUrl(currentUrl.toString());
    const storedOrderId = await AsyncStorage.getItem(PENDING_ORDER_KEY);
    const orderId = urlOrderId || storedOrderId;

    if (!status && !urlOrderId && !storedOrderId) {
      return false;
    }

    const normalizedUrlStatus = normalizeStatus(status);

    if (normalizedUrlStatus === "CANCELLED" || normalizedUrlStatus === "CANCELED") {
      await finishUrlFlow();
      notifyPaymentCancelled("PayPal payment complete nahi hua.");
      currentUrl.searchParams.delete("paypal_status");
      currentUrl.searchParams.delete("token");
      currentUrl.searchParams.delete("paypal_token");
      window.history.replaceState({}, "", currentUrl.toString());
      return true;
    }

    if (
      (["SUCCESS", "COMPLETED", "PAID", "APPROVED"].includes(
        normalizedUrlStatus
      ) ||
        urlOrderId ||
        storedOrderId) &&
      orderId
    ) {
      try {
        await completeCapture({ orderId, payerId });
      } finally {
        await finishUrlFlow();
        currentUrl.searchParams.delete("paypal_status");
        currentUrl.searchParams.delete("token");
        currentUrl.searchParams.delete("orderId");
        currentUrl.searchParams.delete("PayerID");
        currentUrl.searchParams.delete("paypal_token");
        window.history.replaceState({}, "", currentUrl.toString());
      }
      return true;
    }

    return false;
  };

  const handleRedirectUrl = async (url) => {
    if (!handlingReturnRef.current || !url) {
      return false;
    }

    if (url.startsWith(CANCEL_PREFIX)) {
      await finishUrlFlow();
      notifyPaymentCancelled("PayPal payment complete nahi hua.");
      return true;
    }

    const isSuccessRedirect =
      url.startsWith(SUCCESS_PREFIX) || isMobileReturnUrl(url);

    if (!isSuccessRedirect) {
      return false;
    }

    const { orderId: urlOrderId, payerId } = parsePayPalReturnUrl(url);
    const orderId =
      urlOrderId ||
      pendingOrderIdRef.current ||
      (await AsyncStorage.getItem(PENDING_ORDER_KEY));

    if (!orderId) {
      await finishUrlFlow();
      notifyPaymentCancelled("PayPal payment complete nahi hua.");
      return true;
    }

    try {
      await completeCapture({ orderId, payerId });
    } finally {
      await finishUrlFlow();
    }
    return true;
  };

  useEffect(() => {
    handleBrowserReturn().catch((error) => {
      console.error(
        "PayPal web return error:",
        error.response?.data || error.message
      );
      notifyPaymentError(error, "PayPal payment complete nahi ho saka.");
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handlePayPalReturn(url).catch((error) => {
        console.error(
          "PayPal redirect error:",
          error.response?.data || error.message
        );
        notifyPaymentError(error, "PayPal payment complete nahi ho saka.");
      });
    });

    Linking.getInitialURL()
      .then((url) => {
        if (!url) {
          return;
        }

        return handlePayPalReturn(url);
      })
      .catch((error) => {
        console.error("Initial PayPal URL error:", error.message);
      });

    return () => subscription.remove();
  }, [authReady, authToken]);

  const handlePayPalPayment = async () => {
    try {
      if (!authReadyRef.current) {
        throw new Error("Authentication is still loading");
      }

      if (!authTokenRef.current) {
        throw new Error("Please login before making a PayPal payment");
      }

      setLoading(true);
      handlingReturnRef.current = true;

      const returnUrl =
        Platform.OS === "web"
          ? getBrowserRedirectUrl("success")
          : getMobileRedirectUrl();
      const cancelUrl =
        Platform.OS === "web"
          ? getBrowserRedirectUrl("cancelled")
          : getMobileRedirectUrl();
      const redirectUrl =
        Platform.OS === "web" ? window.location.href : getMobileRedirectUrl();

      const createResponse = createOrderRequest
        ? await createOrderRequest({
            amount,
            currency,
            purpose,
            meta,
            referenceId,
            returnUrl,
            cancelUrl,
            authToken: authTokenRef.current,
          })
        : await createPayPalOrder({
            amount,
            currency,
            purpose,
            meta,
            referenceId,
            returnUrl,
            cancelUrl,
            authToken: authTokenRef.current,
          });

      const orderId = getOrderId(createResponse);
      const approvalUrl = getApprovalUrl(createResponse);

      if (!orderId || !approvalUrl) {
        throw new Error("PayPal order ID or approval URL missing");
      }

      await storePendingOrder(orderId);

      await openPayPalCheckout(approvalUrl, redirectUrl);
    } catch (error) {
      await clearPendingOrder();
      handlingReturnRef.current = false;
      setLoading(false);

      if (isPaymentCancelledError(error)) {
        return;
      }

      console.error(
        "PayPal frontend error:",
        error.response?.data || error.message
      );

      notifyPaymentError(error, "PayPal payment complete nahi ho saka.");
    }
  };

  useImperativeHandle(ref, () => ({
    startPayment: handlePayPalPayment,
  }));

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePayPalPayment}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            {buttonLabel ||
              `Pay ${currency} ${Number(amount).toFixed(2)} with PayPal`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

export default PayPalCheckoutButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0070ba",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
