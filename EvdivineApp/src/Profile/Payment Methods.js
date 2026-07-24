import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PayPalCheckoutButton from "../components/PayPalCheckoutButton";
import { useAuth } from "../context/AuthContext";
import {
  captureBookingPayPalOrder,
  createBookingPayPalOrder,
  getBookingPaymentStatus,
  payBookingFromWallet,
} from "../Services/bookingApi";
import { getWalletBalance } from "../Services/walletApi";

const PaymentMethods = ({ navigation, route }) => {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const bookingDetails = route?.params || {};
  const [paypalAmount, setPaypalAmount] = useState(
    String(bookingDetails.amount || "10")
  );
  const [bookingPaymentInfo, setBookingPaymentInfo] = useState({
    loading: false,
    success: false,
    message: "",
    paymentStatus: "",
    bookingStatus: "",
  });
  const [walletPaymentLoading, setWalletPaymentLoading] = useState(false);
  const [walletBalanceInfo, setWalletBalanceInfo] = useState({
    loading: false,
    balance: null,
    currency: bookingDetails.currency || "USD",
  });
  const isBookingPayment = Boolean(bookingDetails.bookingId);
  const bookingSummaryTitle = bookingDetails.consultationType || "Booking";
  const bookingPaymentMethod = String(
    bookingDetails.paymentMethod || "wallet"
  ).toLowerCase();
  const bookingSummaryLines = [
    bookingDetails.consultationDate,
    bookingDetails.consultationTime,
  ].filter(Boolean);

  useEffect(() => {
    if (bookingDetails.amount) {
      setPaypalAmount(String(bookingDetails.amount));
    }
  }, [bookingDetails.amount]);

  useEffect(() => {
    if (!isBookingPayment || !authReady || !authToken) {
      return undefined;
    }

    let alive = true;

    const loadWalletBalance = async () => {
      setWalletBalanceInfo((prev) => ({ ...prev, loading: true }));

      try {
        const response = await getWalletBalance({ authToken });
        const payload = response?.data?.data || response?.data || {};
        if (!alive) return;

        setWalletBalanceInfo({
          loading: false,
          balance: Number(payload?.balance || 0),
          currency: bookingDetails.currency || "USD",
        });
      } catch (error) {
        if (!alive) return;
        setWalletBalanceInfo((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    };

    void loadWalletBalance();

    return () => {
      alive = false;
    };
  }, [authReady, authToken, bookingDetails.currency, isBookingPayment]);

  const refreshBookingPaymentStatus = async ({ silent = false } = {}) => {
    if (!isBookingPayment || !bookingDetails.bookingId || !authReady || !authToken) {
      return null;
    }

    try {
      if (!silent) {
        setBookingPaymentInfo((prev) => ({ ...prev, loading: true }));
      }

      const response = await getBookingPaymentStatus({
        bookingId: bookingDetails.bookingId,
        authToken,
      });
      const payload = response?.data?.data || response?.data || {};

      setBookingPaymentInfo({
        loading: false,
        success: Boolean(payload?.success),
        message:
          payload?.message ||
          (payload?.success ? "Payment successful" : "Payment pending"),
        paymentStatus: String(payload?.paymentStatus || "").toLowerCase(),
        bookingStatus: String(payload?.bookingStatus || "").toLowerCase(),
      });

      return payload;
    } catch (error) {
      setBookingPaymentInfo({
        loading: false,
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Payment status load nahi ho paya.",
        paymentStatus: "",
        bookingStatus: "",
      });
      return null;
    }
  };

  const waitForBookingPaymentSuccess = async ({
    attempts = 8,
    delayMs = 1200,
  } = {}) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const payload = await refreshBookingPaymentStatus({
        silent: attempt > 0,
      });

      if (payload?.success) {
        return payload;
      }

      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return null;
  };

  useEffect(() => {
    if (!isBookingPayment || !authReady || !authToken) {
      return undefined;
    }

    void refreshBookingPaymentStatus({ silent: true });
    const timer = setInterval(() => {
      void refreshBookingPaymentStatus({ silent: true });
    }, 5000);

    return () => clearInterval(timer);
  }, [authReady, authToken, bookingDetails.bookingId, isBookingPayment]);

  const handleBackPress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      window.history.back();
      return;
    }

    const fallbackRoute =
      bookingDetails.returnTo ||
      (bookingDetails.consultationType ? "Booking" : "Profile");

    if (fallbackRoute && navigation?.navigate) {
      navigation.navigate(fallbackRoute, bookingDetails.returnParams || {});
    }
  };

  const getPayPalErrorMessage = (error) => {
    const backendMessage = error?.response?.data?.message;
    const backendCode = error?.response?.data?.code;
    const errorCode = error?.code;
    const fallbackMessage =
      error?.message || "PayPal payment complete nahi ho saka.";

    if (errorCode === "PAYPAL_PAYMENT_CANCELLED") {
      return backendMessage || "PayPal payment cancelled ho gaya.";
    }

    if (backendMessage) {
      return backendMessage;
    }

    if (backendCode === "PAYPAL_ORDER_NOT_APPROVED") {
      return "PayPal order approve nahi hua. Pehle sandbox checkout page me Approve / Continue click karein.";
    }

    return fallbackMessage;
  };

  const getPayPalPendingMessage = (response) => {
    const backendMessage = response?.response?.data?.message;
    const status = String(
      response?.data?.status ||
        response?.data?.data?.status ||
        response?.data?.data?.payment?.status ||
        response?.status ||
        ""
    ).toUpperCase();

    return (
      backendMessage ||
      `PayPal payment ${
        status || "pending"
      } hai. Status update hone tak wait karein.`
    );
  };

  const formatMoney = (value, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const handleBookingWalletPayment = async () => {
    if (walletPaymentLoading) {
      return;
    }

    if (!authReady) {
      Alert.alert(
        "Please wait",
        "Login state load ho raha hai. Thodi der baad try karein."
      );
      return;
    }

    if (!isAuthenticated || !authToken) {
      Alert.alert(
        "Login required",
        "Booking payment ke liye pehle login karna zaroori hai."
      );
      navigation?.navigate?.("Login", {
        redirectTo: "PaymentMethods",
        redirectParams: bookingDetails,
        successMessage: "Please login to continue booking payment.",
      });
      return;
    }

    if (!bookingDetails.bookingId) {
      Alert.alert("Missing booking", "Booking ID not found.");
      return;
    }

    const requiredAmount = Number(bookingDetails.amount || 0);
    const availableBalance =
      walletBalanceInfo.balance === null
        ? null
        : Number(walletBalanceInfo.balance || 0);

    if (availableBalance !== null && availableBalance < requiredAmount) {
      Alert.alert(
        "Insufficient wallet balance",
        `Booking ke liye ${formatMoney(
          requiredAmount,
          bookingDetails.currency || "USD"
        )} chahiye. Aapke wallet me ${formatMoney(
          availableBalance,
          bookingDetails.currency || "USD"
        )} hai.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Wallet",
            onPress: () => navigation?.navigate?.("Wallet"),
          },
        ]
      );
      return;
    }

    setWalletPaymentLoading(true);

    try {
      const response = await payBookingFromWallet({
        bookingId: bookingDetails.bookingId,
        authToken,
      });
      const payload = response?.data?.data || response?.data || {};
      const confirmed = await waitForBookingPaymentSuccess();

      if (confirmed?.success || payload?.payment?.status === "completed") {
        setBookingPaymentInfo({
          loading: false,
          success: true,
          message: confirmed?.message || payload?.message || "Payment successful",
          paymentStatus: "completed",
          bookingStatus: "confirmed",
        });
      }

      Alert.alert(
        confirmed?.success ? "Payment successful" : "Payment pending",
        confirmed?.message ||
          payload?.message ||
          "Wallet payment completed. Booking status update ho rahi hai."
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Wallet payment complete nahi ho saka.";
      const code = error?.response?.data?.code || error?.code || "";

      if (code === "INSUFFICIENT_BALANCE") {
        Alert.alert("Insufficient balance", message, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Wallet",
            onPress: () => navigation?.navigate?.("Wallet"),
          },
        ]);
        return;
      }

      Alert.alert("Payment failed", message);
    } finally {
      setWalletPaymentLoading(false);
    }
  };

  const bookingPayPalCreateOrder = async ({
    returnUrl = "",
    cancelUrl = "",
    authToken: requestToken = "",
  } = {}) =>
    createBookingPayPalOrder({
      bookingId: bookingDetails.bookingId,
      returnUrl,
      cancelUrl,
      authToken: requestToken || authToken,
    });

  const bookingPayPalCaptureOrder = async ({
    orderId,
    payerId = "",
    authToken: requestToken = "",
  } = {}) =>
    captureBookingPayPalOrder({
      bookingId: bookingDetails.bookingId,
      paypalOrderId: orderId,
      payerId,
      authToken: requestToken || authToken,
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#A34B1F" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Payment Methods</Text>

        <View style={styles.headerIcon}>
          <Ionicons name="card-outline" size={26} color="#fff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isBookingPayment ? (
          <View
            style={[
              styles.paymentStatusCard,
              bookingPaymentInfo.success
                ? styles.paymentStatusCardSuccess
                : styles.paymentStatusCardPending,
            ]}
          >
            <View style={styles.paymentStatusTopRow}>
              <View
                style={[
                  styles.paymentStatusIcon,
                  bookingPaymentInfo.success
                    ? styles.paymentStatusIconSuccess
                    : styles.paymentStatusIconPending,
                ]}
              >
                <Ionicons
                  name={
                    bookingPaymentInfo.success
                      ? "checkmark-circle"
                      : "time-outline"
                  }
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentStatusTitle}>
                  {bookingPaymentInfo.success
                    ? "Payment successful"
                    : "Pending payment"}
                </Text>
                <Text style={styles.paymentStatusText}>
                  {bookingPaymentInfo.loading
                    ? "Payment status verify ki ja rahi hai..."
                    : bookingPaymentInfo.message ||
                      (bookingPaymentInfo.success
                        ? "Payment complete ho chuki hai."
                        : "Wallet payment pending hai. Pay button dabayein.")}
                </Text>
              </View>
            </View>
            {bookingPaymentInfo.success ? (
              <TouchableOpacity
                style={styles.paymentStatusButton}
                onPress={() =>
                  navigation?.navigate?.("MyBooking", { refreshKey: Date.now() })
                }
              >
                <Text style={styles.paymentStatusButtonText}>View Booking</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {isBookingPayment ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Booking Summary</Text>
            <Text style={styles.summaryTitle}>{bookingSummaryTitle}</Text>
            {bookingSummaryLines.map((line) => (
              <Text key={line} style={styles.summaryText}>
                {line}
              </Text>
            ))}
            <View style={styles.bookingSummaryFooter}>
              <Text style={styles.bookingSummaryId}>
                Booking ID: {bookingDetails.bookingId}
              </Text>
              <Text style={styles.bookingSummaryAmount}>
                {bookingDetails.currency || "USD"}{" "}
                {Number(bookingDetails.amount || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : null}

        {isBookingPayment && !bookingPaymentInfo.success ? (
          <View style={styles.bookingPaymentCard}>
            <View style={styles.bookingPaymentTopRow}>
              <View style={styles.bookingPaymentIcon}>
                <Ionicons name="calendar" size={20} color="#A34B1F" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.bookingPaymentTitle}>
                  Complete Booking Payment
                </Text>
                <Text style={styles.bookingPaymentSubtitle}>
                  Booking ab wallet se auto-confirm hogi. Balance kam ho to pehle wallet add karein.
                </Text>
              </View>
            </View>

            <View style={styles.walletBalancePreview}>
              <View>
                <Text style={styles.walletBalanceLabel}>Wallet Balance</Text>
                <Text style={styles.walletBalanceValue}>
                  {walletBalanceInfo.loading
                    ? "Checking..."
                    : walletBalanceInfo.balance === null
                    ? "Unknown"
                    : formatMoney(
                        walletBalanceInfo.balance,
                        walletBalanceInfo.currency
                      )}
                </Text>
              </View>
              <View style={styles.walletBalanceNeedBox}>
                <Text style={styles.walletBalanceNeedLabel}>Required</Text>
                <Text style={styles.walletBalanceNeedValue}>
                  {formatMoney(
                    bookingDetails.amount || 0,
                    bookingDetails.currency || "USD"
                  )}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.bookingWalletButton,
                walletPaymentLoading && styles.bookingWalletButtonDisabled,
              ]}
              onPress={handleBookingWalletPayment}
              disabled={walletPaymentLoading}
            >
              {walletPaymentLoading ? (
                <Ionicons name="hourglass-outline" size={20} color="#fff" />
              ) : (
                <Ionicons name="wallet-outline" size={20} color="#fff" />
              )}
              <Text style={styles.bookingWalletButtonText}>
                {walletPaymentLoading ? "Processing..." : "Pay with Wallet"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rechargeWalletButton}
              onPress={() => navigation?.navigate?.("Wallet")}
            >
              <Ionicons name="add-circle-outline" size={18} color="#A34B1F" />
              <Text style={styles.rechargeWalletButtonText}>
                Add Wallet Balance
              </Text>
            </TouchableOpacity>

            {bookingPaymentMethod === "paypal" ? (
              <PayPalCheckoutButton
                amount={Number(bookingDetails.amount || 10)}
                currency={bookingDetails.currency || "USD"}
                purpose="booking"
                referenceId={bookingDetails.bookingId}
                createOrderRequest={bookingPayPalCreateOrder}
                captureOrderRequest={bookingPayPalCaptureOrder}
                buttonLabel="Pay with PayPal"
                showAlerts={false}
                onPaymentSuccess={async () => {
                  const payload = await waitForBookingPaymentSuccess();
                  Alert.alert(
                    payload?.success ? "Payment successful" : "Payment pending",
                    payload?.message ||
                      (payload?.success
                        ? "Booking PayPal payment completed."
                        : "Payment complete hua, booking update ho rahi hai.")
                  );
                }}
                onPaymentPending={(response) => {
                  Alert.alert(
                    "Payment pending",
                    getPayPalPendingMessage(response)
                  );
                }}
                onPaymentError={(error) => {
                  const message = getPayPalErrorMessage(error);
                  const title =
                    error?.code === "PAYPAL_PAYMENT_CANCELLED"
                      ? "Payment cancelled"
                      : "Payment failed";
                  Alert.alert(title, message);
                }}
              />
            ) : null}
          </View>
        ) : null}

        {!isBookingPayment ? (
          <View style={styles.checkoutCard}>
            <View style={styles.checkoutHeader}>
              <View style={styles.checkoutIconBox}>
                <Ionicons name="logo-paypal" size={20} color="#0070ba" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.checkoutTitle}>PayPal Checkout</Text>
                <Text style={styles.checkoutSubtitle}>
                  Smooth sandbox payment flow with auto capture
                </Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                value={paypalAmount}
                onChangeText={setPaypalAmount}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#999"
              />
            </View>

            <PayPalCheckoutButton
              amount={Number(paypalAmount) || 10}
              currency="USD"
              purpose={bookingDetails.purpose || "wallet_recharge"}
              meta={
                bookingDetails.meta || {
                  consultationType: bookingDetails.consultationType || "",
                  consultationDate: bookingDetails.consultationDate || "",
                  consultationTime: bookingDetails.consultationTime || "",
                  consultationRoute: bookingDetails.consultationRoute || "",
                }
              }
              buttonLabel="Continue to PayPal"
              showAlerts={false}
              onPaymentSuccess={(response) => {
                Alert.alert("Success", "PayPal payment completed.");
                console.log("PayPal success:", response);
              }}
              onPaymentPending={(response) => {
                Alert.alert(
                  "Payment pending",
                  getPayPalPendingMessage(response)
                );
              }}
              onPaymentError={(error) => {
                const message = getPayPalErrorMessage(error);
                const title =
                  error?.code === "PAYPAL_PAYMENT_CANCELLED"
                    ? "Payment cancelled"
                    : "Payment failed";
                Alert.alert(title, message);
                console.log(
                  "PayPal error:",
                  error?.response?.data || error?.message || error
                );
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethods;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F4FA",
  },

  header: {
    backgroundColor: "#A34B1F",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 8,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  paymentStatusCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  paymentStatusCardSuccess: {
    backgroundColor: "#ECFDF3",
    borderColor: "#A7F3D0",
  },
  paymentStatusCardPending: {
    backgroundColor: "#FFF8E8",
    borderColor: "#F4D58A",
  },
  paymentStatusTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentStatusIconSuccess: {
    backgroundColor: "#10B981",
  },
  paymentStatusIconPending: {
    backgroundColor: "#F59E0B",
  },
  paymentStatusTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  paymentStatusText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  paymentStatusButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#A34B1F",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  paymentStatusButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  summaryCard: {
    backgroundColor: "#FFF7EF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0D8C9",
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A34B1F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  bookingSummaryFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EFDCCF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  bookingSummaryId: {
    flex: 1,
    fontSize: 11,
    color: "#8F6A52",
    fontWeight: "700",
  },

  bookingSummaryAmount: {
    fontSize: 14,
    color: "#A34B1F",
    fontWeight: "900",
  },

  bookingPaymentCard: {
    backgroundColor: "#FFF7EF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0D8C9",
  },

  bookingPaymentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  bookingPaymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  bookingPaymentTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
  },

  bookingPaymentSubtitle: {
    fontSize: 12,
    color: "#7A6A5C",
    marginTop: 3,
    lineHeight: 18,
  },

  bookingWalletButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#A34B1F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },

  bookingWalletButtonDisabled: {
    opacity: 0.78,
  },

  bookingWalletButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  walletBalancePreview: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0D8C9",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  walletBalanceLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#8F6A52",
    fontWeight: "800",
  },

  walletBalanceValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginTop: 4,
  },

  walletBalanceNeedBox: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  walletBalanceNeedLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#8F6A52",
    fontWeight: "800",
  },

  walletBalanceNeedValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#A34B1F",
    marginTop: 4,
  },

  rechargeWalletButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#A34B1F",
    backgroundColor: "#FFF7EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },

  rechargeWalletButtonText: {
    color: "#A34B1F",
    fontSize: 15,
    fontWeight: "800",
  },

  walletCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0E7E1",
  },

  walletTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  walletTitle: {
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
  },

  walletBalance: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
    marginTop: 6,
  },

  walletSubtitle: {
    fontSize: 13,
    color: "#999",
    marginTop: 3,
  },

  walletIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F4EBE6",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EFE5DE",
  },

  checkoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  checkoutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EAF4FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  checkoutTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  checkoutSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  amountRow: {
    marginBottom: 14,
  },

  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 8,
  },

  amountInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E1EF",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },

  bankCard: {
    minHeight: 150,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#A34B1F",
    justifyContent: "space-between",
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardType: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  cardNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 18,
    letterSpacing: 1.5,
  },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 5,
  },

  cardValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  addCardButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A34B1F",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addCardText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#A34B1F",
    marginLeft: 8,
  },

  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
  },

  activeOptionCard: {
    borderColor: "#A34B1F",
    backgroundColor: "#FBF7FF",
  },

  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  optionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1E4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activeIconBox: {
    backgroundColor: "#A34B1F",
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  optionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  continueButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#A34B1F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  continueText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8E1EF",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
  },

  row: {
    flexDirection: "row",
  },

  modalButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#A34B1F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
});
