import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Platform } from "react-native";
import * as ExpoLinking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import AdminRequestAlertListener from "./src/admin/AdminRequestAlertListener";
import UserChatAccessListener from "./src/listeners/UserChatAccessListener";
import UserNotificationListener from "./src/listeners/UserNotificationListener";
import { navigationRef } from "./src/navigation/navigationRef";

const linking = {
  prefixes: [ExpoLinking.createURL("/"), "evdivineapp://"],
  config: {
    screens: {
      MainTabs: {
        path: "",
        screens: {
          Home: "",
          About: "about",
          Services: "services",
          Booking: "booking",
          Blog: "blog",
          Chat: "chat",
          Profile: "profile",
        },
      },
      Signup: "signup",
      OtpVerification: "otp-verification",
      Login: "login",
      AdminLogin: "admin-login",
      ChatAccessRequests: "admin/chat-access-requests",
      AdminBanners: "admin/banners",
      AdminPricing: "admin/pricing",
      AdminContactMessages: "admin/contact-messages",
      AdminBlogCreate: "admin/blogs/create",
      BlogCategories: "admin/blog-categories",
      RashiDetail: "rashi/:slug",
      ForgotPassword: "forgot-password",
      ResetPassword: "reset-password",
      Contact: "contact",
      Blocks: "blocks",
      MyBooking: "my-booking",
      BookingHistory: "booking-history",
      MyProfile: "my-profile",
      Wallet: "wallet",
      PaymentMethods: "payment-methods",
      Notifications: "notifications",
      HelpSupport: "help-support",
      LegalInfo: "legal-info",
      Logout: "logout",
      contactus: "contact-us",
      FAQ: "faq",
      Agreement: "agreement",
      TermsCondition: "terms-condition",
      SatisfactionGuarantee: "satisfaction-guarantee",
      PrivacyPolicies: "privacy-policies",
      AdvisorTermsCondition: "advisor-terms-condition",
      BlogDetail: "blog/:slug",
      OfferDetail: "offers/:id",
      TarotReading: "tarot-reading",
      AstrologyConsultation: "astrology-consultation",
      PalmReading: "palm-reading",
      VastuConsultation: "vastu-consultation",
      Numerology: "numerology",
      AuraReading: "aura-reading",
      PsychicReading: "psychic-reading",
      ChatSession: "chat-session",
      CallSession: "call-session",
      VideoCallSession: "video-call-session",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <AdminRequestAlertListener />
          <UserChatAccessListener />
          <UserNotificationListener />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
