import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  View,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import BottomNavbar from "../components/BottomNavbar";

import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import ServicesScreen from "../screens/ServicesScreen";
import BookingScreen from "../screens/BookingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatSessionScreen from "../ConsultationType/ChatSession";
import LoginScreen from "../auth/LoginScreen";
import AdminLoginScreen from "../admin/AdminLoginScreen";
import SignupScreen from "../auth/SignupScreen";
import OtpVerificationScreen from "../auth/OtpVerificationScreen";
import ForgotPasswordScreen from "../auth/ForgotPassword";
import ResetPasswordScreen from "../auth/ResetPassword";
import ContactScreen from "../screens/ContactScreen";
import BlocksScreen from "../screens/BlocksScreen";
import SectionDetailScreen from "../screens/SectionDetailScreen";
import MyBookingScreen from "../Profile/My Booking";
import BookingHistoryScreen from "../Profile/Booking History";
import MyProfileScreen from "../Profile/My Profile";
import WalletScreen from "../Profile/Wallet";
import PaymentMethodsScreen from "../Profile/Payment Methods";
import NotificationsScreen from "../Profile/Notifications";
import HelpSupportScreen from "../Profile/Help Support";
import LegalInfoScreen from "../Profile/legal info";
import LogoutScreen from "../Profile/Logout";
import ContactUsScreen from "../Profile/contact us";
import FAQScreen from "../Profile/FAQ";
import AgreementScreen from "../Profile/Agreement";
import TermsConditionScreen from "../Profile/Terms and condition";
import DisclaimerScreen from "../Profile/Disclaimer";
import RefundCancellationPolicyScreen from "../Profile/Refund & Cancellation Policy";
import SatisfactionGuaranteeScreen from "../Profile/Satisfaction Guarantee";
import PrivacyPoliciesScreen from "../Profile/Privacy Policies";
import CookiesPolicyScreen from "../Profile/Cookies Policy";
import AdvisorTermsConditionScreen from "../Profile/Advisor Terms and Condition ";
import AstrologyConsultationScreen from "../Services/Astrology Consultation";
import AuraReadingScreen from "../Services/Aura Reading";
import NumerologyScreen from "../Services/Numerology";
import PalmReadingScreen from "../Services/Palm Reading";
import VastuConsultationScreen from "../Services/Vastu Consultation";
import PsychicReadingScreen from "../Services/Psychic reading";
import TarotReadingScreen from "../Services/Tarot Reading";
import CallSessionScreen from "../ConsultationType/CallSession";
import VideoCallSessionScreen from "../ConsultationType/VideoCallSession";
import ChatAccessRequestsScreen from "../admin/ChatAccessRequestsScreen";
import AdminBannerScreen from "../admin/AdminBannerScreen";
import AdminPricingScreen from "../admin/AdminPricingScreen";
import AdminBlogCreateScreen from "../admin/AdminBlogCreateScreen";
import BlogCategoriesScreen from "../admin/BlogCategoriesScreen";
import ContactMessagesScreen from "../admin/ContactMessagesScreen";
import RashiDetailScreen from "../screens/RashiDetailScreen";
import OfferDetailScreen from "../screens/OfferDetailScreen";
import MenuScreen from "../screens/MenuScreen";
import BlogListPage from "../pages/blog/BlogListPage";
import BlogDetailPage from "../pages/blog/BlogDetailPage";
import { NAV_ITEMS } from "./navItems";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ChatSessionGuard(props) {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const hasAccess = authReady && isAuthenticated && authToken;

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!hasAccess) {
      props.navigation?.navigate?.("Login", {
        redirectTo: "Chat",
        redirectParams: props.route?.params || {},
        successMessage: "Chat access ke liye pehle login ya sign up karein.",
      });
    }
  }, [authReady, hasAccess, props.navigation, props.route?.params]);

  if (!authReady || !hasAccess) {
    return (
      <View style={guardStyles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
        <Text style={guardStyles.loadingTitle}>Login required</Text>
        <Text style={guardStyles.loadingText}>
          Chat session kholne se pehle login ya sign up karein.
        </Text>
      </View>
    );
  }

  return <ChatSessionScreen {...props} />;
}

function MainTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  const tabBarInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 12 : 10
  );
  const mobileTabBarHeight = 64 + tabBarInset;
  // Desktop navbar height is roughly 90px; add a larger buffer so the hero
  // banner sits lower beneath the navbar and does not feel cramped.
  const desktopHeaderHeight = 116 + insets.top;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) =>
        isDesktop ? (
          <TopNavbar
            mode="desktop"
            navigation={props.navigation}
            activeRouteName={props.state.routes[props.state.index]?.name}
            onNotification={() => props.navigation.navigate("Notifications")}
            onMenu={() => props.navigation.navigate("Menu")}
          />
        ) : (
          <BottomNavbar {...props} />
        )
      }
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: isDesktop ? 0 : mobileTabBarHeight,
          display: isDesktop ? "none" : "flex",
        },
        sceneContainerStyle: {
          backgroundColor: Colors.bg,
          paddingTop: isDesktop ? desktopHeaderHeight : 0,
        },
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: "rgba(255,255,255,0.62)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const screenMap = {
          Home: HomeScreen,
          About: AboutScreen,
          Services: ServicesScreen,
          Booking: BookingScreen,
          Blog: BlogListPage,
          Chat: ChatSessionGuard,
          Profile: ProfileScreen,
        };

        return (
          <Tab.Screen
            key={item.name}
            name={item.name}
            component={screenMap[item.name]}
          />
        );
      })}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="MainTabs"
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="BlogDetail" component={BlogDetailPage} />
      <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen
        name="ChatAccessRequests"
        component={ChatAccessRequestsScreen}
      />
      <Stack.Screen name="AdminBanners" component={AdminBannerScreen} />
      <Stack.Screen name="AdminPricing" component={AdminPricingScreen} />
      <Stack.Screen name="AdminContactMessages" component={ContactMessagesScreen} />
      <Stack.Screen name="AdminBlogCreate" component={AdminBlogCreateScreen} />
      <Stack.Screen name="BlogCategories" component={BlogCategoriesScreen} />
      <Stack.Screen name="RashiDetail" component={RashiDetailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Blocks" component={BlocksScreen} />
      <Stack.Screen name="SectionDetail" component={SectionDetailScreen} />
      <Stack.Screen name="MyBooking" component={MyBookingScreen} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="LegalInfo" component={LegalInfoScreen} />
      <Stack.Screen name="Logout" component={LogoutScreen} />
      <Stack.Screen name="contactus" component={ContactUsScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Agreement" component={AgreementScreen} />
      <Stack.Screen name="TermsCondition" component={TermsConditionScreen} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <Stack.Screen
        name="RefundCancellationPolicy"
        component={RefundCancellationPolicyScreen}
      />
      <Stack.Screen
        name="SatisfactionGuarantee"
        component={SatisfactionGuaranteeScreen}
      />
      <Stack.Screen name="PrivacyPolicies" component={PrivacyPoliciesScreen} />
      <Stack.Screen name="CookiesPolicy" component={CookiesPolicyScreen} />
      <Stack.Screen
        name="AdvisorTermsCondition"
        component={AdvisorTermsConditionScreen}
      />
      <Stack.Screen name="TarotReading" component={TarotReadingScreen} />
      <Stack.Screen
        name="AstrologyConsultation"
        component={AstrologyConsultationScreen}
      />
      <Stack.Screen name="PalmReading" component={PalmReadingScreen} />
      <Stack.Screen
        name="VastuConsultation"
        component={VastuConsultationScreen}
      />
      <Stack.Screen name="Numerology" component={NumerologyScreen} />
      <Stack.Screen name="AuraReading" component={AuraReadingScreen} />
      <Stack.Screen name="PsychicReading" component={PsychicReadingScreen} />
      <Stack.Screen name="ChatSession" component={ChatSessionGuard} />
      <Stack.Screen name="CallSession" component={CallSessionScreen} />
      <Stack.Screen
        name="VideoCallSession"
        component={VideoCallSessionScreen}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});

const guardStyles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#2E160B",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  loadingText: {
    color: "#D8CFF3",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },
});
