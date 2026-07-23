import React, { useEffect, useState } from "react";
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
  payBookingFromWallet,
} from "../Services/bookingApi";
import PageContentSection from "../components/PageContentSection";

const PaymentMethods = ({ navigation, route }) => {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const bookingDetails = route?.params || {};
  const [paypalAmount, setPaypalAmount] = useState(
    String(bookingDetails.amount || "10")
  );
  const isBookingPayment = Boolean(bookingDetails.bookingId);
  const bookingSummaryTitle = bookingDetails.consultationType || "Booking";
  const bookingSummaryLines = [
    bookingDetails.consultationDate,
    bookingDetails.consultationTime,
  ].filter(Boolean);

  useEffect(() => {
    if (bookingDetails.amount) {
      setPaypalAmount(String(bookingDetails.amount));
    }
  }, [bookingDetails.amount]);

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

  const handleBookingWalletPayment = async () => {
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

    try {
      const response = await payBookingFromWallet({
        bookingId: bookingDetails.bookingId,
        authToken,
      });

      Alert.alert(
        "Booking paid",
        response?.data?.message || "Wallet payment completed successfully."
      );

      navigation?.navigate?.("MyBooking", {
        refreshKey: Date.now(),
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Wallet payment complete nahi ho saka.";
      Alert.alert("Payment failed", message);
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
        <PageContentSection
          pageKey="payment-methods"
          titleFallback="Payment Methods"
          subtitleFallback="Payment instructions and backend content"
          icon="card-outline"
        />

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

        {isBookingPayment ? (
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
                  Wallet ya PayPal se booking ko confirm karein.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookingWalletButton}
              onPress={handleBookingWalletPayment}
            >
              <Ionicons name="wallet-outline" size={20} color="#fff" />
              <Text style={styles.bookingWalletButtonText}>
                Pay with Wallet
              </Text>
            </TouchableOpacity>

            <PayPalCheckoutButton
              amount={Number(bookingDetails.amount || 10)}
              currency={bookingDetails.currency || "USD"}
              purpose="booking"
              referenceId={bookingDetails.bookingId}
              createOrderRequest={bookingPayPalCreateOrder}
              captureOrderRequest={bookingPayPalCaptureOrder}
              buttonLabel="Pay with PayPal"
              showAlerts={false}
              onPaymentSuccess={() => {
                Alert.alert("Success", "Booking PayPal payment completed.");
                navigation?.navigate?.("MyBooking", {
                  refreshKey: Date.now(),
                });
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

  bookingWalletButtonText: {
    color: "#fff",
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
