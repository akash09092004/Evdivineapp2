import React, { useState } from "react";
import { Alert, SafeAreaView, StatusBar, StyleSheet } from "react-native";

import ResponsiveScreen from "../components/ResponsiveScreen";
import { Colors } from "../theme/colors";
import TimeSlots from "../BookingDetailsScreen/Time Slots";
import { useAuth } from "../context/AuthContext";
import { navigationRef } from "../navigation/navigationRef";
import { createPendingBooking, lockBookingSlot } from "../Services/bookingApi";

const DEFAULT_PLAN_ID = String(
  process.env.EXPO_PUBLIC_CHAT_PLAN_ID || "6a598ebe8d67169c8c697b6e"
).trim();

const toIsoStartAt = (date, startMinutes) => {
  const safeDate = date instanceof Date ? new Date(date) : new Date(date);
  const hours = Math.floor(Number(startMinutes || 0) / 60);
  const minutes = Number(startMinutes || 0) % 60;

  safeDate.setHours(hours, minutes, 0, 0);
  return safeDate.toISOString();
};

export default function BookingScreen({ navigation, route }) {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const serviceName = String(
    route?.params?.service || route?.params?.rashiName || "Chat Consultation"
  ).trim();
  const consultationType = String(
    route?.params?.consultationType || "Chat"
  ).trim();
  const planId = String(route?.params?.planId || DEFAULT_PLAN_ID).trim();
  const rashiPrice = Number(
    route?.params?.price || route?.params?.consultationPrice || 0
  );
  const [loadingBooking, setLoadingBooking] = useState(false);

  const openPaymentMethods = (params) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("PaymentMethods", params);
      return true;
    }

    const parentNavigation = navigation?.getParent?.();
    const grandParentNavigation = parentNavigation?.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("PaymentMethods", params);
      return true;
    }

    if (grandParentNavigation?.navigate) {
      grandParentNavigation.navigate("PaymentMethods", params);
      return true;
    }

    if (navigation?.navigate) {
      navigation.navigate("PaymentMethods", params);
      return true;
    }

    return false;
  };

  const handleContinue = async (selection) => {
    if (!authReady) {
      Alert.alert("Please wait", "Login state abhi load ho raha hai.");
      return;
    }

    if (!isAuthenticated || !authToken) {
      navigation?.navigate?.("Login", {
        redirectTo: "Booking",
        redirectParams: route?.params || {},
        successMessage: "Please login to continue booking.",
      });
      return;
    }

    if (!planId) {
      Alert.alert(
        "Plan ID missing",
        "Booking save karne ke liye active chat plan ID chahiye. `EXPO_PUBLIC_CHAT_PLAN_ID` ya route param `planId` set karein."
      );
      return;
    }

    const slot = selection?.slot;
    const selectedPlanId = String(selection?.planId || planId || "").trim();
    const startAt = slot?.startAt
      ? new Date(slot.startAt).toISOString()
      : toIsoStartAt(selection?.date, slot?.startMinutes);

    if (!slot) {
      Alert.alert("Select a slot", "Pehle ek available slot select karein.");
      return;
    }

    if (!selectedPlanId) {
      Alert.alert(
        "Plan ID missing",
        "Selected slot ke liye plan ID nahi mila. Please page reload karein."
      );
      return;
    }

    setLoadingBooking(true);

    try {
      const lockResponse = await lockBookingSlot({
        slotPlanId: selectedPlanId,
        startAt,
        timeZone: slot?.timezone || "",
        authToken,
      });

      const lock =
        lockResponse?.data?.data?.lock || lockResponse?.data?.data || {};
      const lockId = lock?._id || lock?.id || lockResponse?.data?.lockId || "";

      if (!lockId) {
        throw new Error("Slot lock id missing");
      }

      const bookingResponse = await createPendingBooking({
        lockId,
        paymentMethod: "paypal",
        authToken,
      });

      const booking =
        bookingResponse?.data?.data || bookingResponse?.data || {};
      const bookingId = booking?._id || booking?.bookingId || "";

      if (!bookingId) {
        throw new Error("Booking id missing");
      }

      const opened = openPaymentMethods({
        bookingId,
        amount:
          booking?.finalAmount ||
          selection?.price ||
          rashiPrice ||
          0,
        currency: booking?.currency || "USD",
        purpose: "booking",
        consultationType: `${serviceName}`,
        consultationDate: selection?.dateLabel || "",
        consultationTime: selection?.timeRange || "",
        serviceName,
        rashiName: String(route?.params?.rashiName || "").trim(),
        rashiSlug: String(route?.params?.rashiSlug || "").trim(),
        consultationPrice: rashiPrice,
        paymentMethod: "paypal",
        returnTo: "Booking",
        returnParams: {
          service: serviceName,
          consultationType,
          planId: selectedPlanId,
          rashiName: String(route?.params?.rashiName || "").trim(),
          rashiSlug: String(route?.params?.rashiSlug || "").trim(),
          price: rashiPrice,
        },
      });

      if (!opened) {
        throw new Error("Payment screen could not be opened.");
      }
    } catch (error) {
      Alert.alert(
        "Booking failed",
        error?.response?.data?.message ||
          error?.message ||
          "Booking create nahi ho saka."
      );
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleBack = () => {
    if (loadingBooking) {
      return;
    }

    navigation?.goBack?.();
  };

  const onContinue = (selection) => {
    void handleContinue(selection);
  };

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
        <TimeSlots
          serviceName={serviceName}
          consultationType={consultationType}
          onBack={handleBack}
          onContinue={onContinue}
          loadingBooking={loadingBooking}
          authToken={authToken}
          initialPlanId={planId}
        />
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
