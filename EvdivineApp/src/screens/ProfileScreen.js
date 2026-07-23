import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import LinearGradient from "../components/LinearGradient";
import ResponsiveScreen from "../components/ResponsiveScreen";
import { Colors, Shadows } from "../theme/colors";

const menuItems = [
  { icon: "💸", label: "Wallet", route: "Wallet" },
  { icon: "📅", label: "My Bookings", route: "MyBooking" },
  { icon: "📋", label: "Booking History", route: "BookingHistory" },
  { icon: "👤", label: "My Profile", route: "MyProfile" },
  { icon: "💳", label: "Payment Methods", route: "PaymentMethods" },
  { icon: "🔔", label: "Notifications", route: "Notifications" },
  { icon: "❓", label: "FAQ", route: "FAQ" },
  { icon: "📝", label: "Agreement", route: "Agreement" },
  { icon: "📄", label: "Terms & Conditions", route: "TermsCondition" },
  { icon: "⚠️", label: "Disclaimer", route: "Disclaimer" },
  { icon: "✅", label: "Satisfaction Guarantee", route: "SatisfactionGuarantee" },
  { icon: "🔁", label: "Refund & Cancellation", route: "RefundCancellationPolicy" },
  { icon: "🛡️", label: "Privacy Policies", route: "PrivacyPolicies" },
  { icon: "🍪", label: "Cookies Policy", route: "CookiesPolicy" },
  { icon: "🧑‍💼", label: "Advisor Terms", route: "AdvisorTermsCondition" },
];

export default function ProfileScreen({ navigation }) {
  const parentNavigation =
    navigation.getParent?.()?.getParent?.() || navigation;

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]}>
            <View style={styles.topBar}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoText}>Evdivine</Text>
              <View style={styles.gearBtn}>
                <Text style={styles.gearIcon}>⚙️</Text>
              </View>
            </View>

            <View style={styles.policiesQuickRow}>
              <TouchableOpacity
                style={styles.policyQuickBtn}
                onPress={() => parentNavigation?.navigate("TermsCondition")}
                activeOpacity={0.85}
              >
                <Text style={styles.policyQuickText}>Terms</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.policyQuickBtn}
                onPress={() => parentNavigation?.navigate("Disclaimer")}
                activeOpacity={0.85}
              >
                <Text style={styles.policyQuickText}>Disclaimer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.policyQuickBtn}
                onPress={() =>
                  parentNavigation?.navigate("SatisfactionGuarantee")
                }
                activeOpacity={0.85}
              >
                <Text style={styles.policyQuickText}>Satisfaction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.policyQuickBtn, styles.policyQuickBtnWide]}
                onPress={() =>
                  parentNavigation?.navigate("RefundCancellationPolicy")
                }
                activeOpacity={0.85}
              >
                <Text style={styles.policyQuickText}>
                  Refund & Cancellation
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👨‍💼</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>Pavneesh</Text>
                <Text style={styles.phone}>+91 98765 43210</Text>
                <Text style={styles.email}>pavneesh@example.com</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Menu */}
          <View style={styles.menuList}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => {
                  console.log("[ProfileScreen] menu press", item.route);
                  parentNavigation?.navigate(item.route);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.menuIcon2}>
                  <Text style={styles.menuEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => parentNavigation?.navigate("HelpSupport")}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon2}>
                <Text style={styles.menuEmoji}>❓</Text>
              </View>
              <Text style={styles.menuLabel}>Help & Support</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => parentNavigation?.navigate("contactus")}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon2}>
                <Text style={styles.menuEmoji}>✉</Text>
              </View>
              <Text style={styles.menuLabel}>Contact Us</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => parentNavigation?.navigate("LegalInfo")}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon2}>
                <Text style={styles.menuEmoji}>📄</Text>
              </View>
              <Text style={styles.menuLabel}>Legal & Info</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => parentNavigation?.navigate("Logout")}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIcon2, { backgroundColor: "#FFF0F0" }]}>
                <Text style={styles.menuEmoji}>🚪</Text>
              </View>
              <Text style={[styles.menuLabel, { color: Colors.danger }]}>
                Logout
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: 34, height: 34 },
  logoText: {
    fontFamily: "serif",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: { fontSize: 18 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 22,
    paddingTop: 10,
  },
  policiesQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  policyQuickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  policyQuickBtnWide: {
    flexGrow: 1,
  },
  policyQuickText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 32 },
  name: { fontSize: 18, fontWeight: "700", color: "white" },
  phone: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  email: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  menuList: { padding: 22, gap: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    ...Shadows.card,
  },
  menuIcon2: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gradientSoftStart,
    alignItems: "center",
    justifyContent: "center",
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.text },
  chevron: { fontSize: 20, color: Colors.textMuted },
});
