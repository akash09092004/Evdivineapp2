import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import AuthBackground from "./components/AuthBackground";
import { API_BASE_URL } from "../config/api";

export default function OtpVerificationScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const verifyLockRef = useRef(false);
  const resendLockRef = useRef(false);

  const email = route?.params?.email || "";
  const purpose = route?.params?.purpose || "signup";
  const redirectTo = route?.params?.redirectTo || "Profile";
  const successMessage =
    route?.params?.successMessage || "OTP verified successfully.";

  const headerText = useMemo(() => {
    if (purpose === "login") {
      return "Verify Login OTP";
    }
    return "Verify Signup OTP";
  }, [purpose]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate("Login", {
      email,
      redirectTo,
      successMessage,
    });
  };

  const handleVerifiedNavigation = () => {
    if (redirectTo === "Profile" || redirectTo === "Chat") {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainTabs",
            params: { screen: redirectTo === "Chat" ? "Chat" : "Profile" },
          },
        ],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: redirectTo }],
    });
  };

  const handleVerify = async () => {
    if (loading || verifyLockRef.current) {
      return;
    }

    if (!email || !otp.trim()) {
      Alert.alert("Error", "Email and OTP are required");
      return;
    }

    verifyLockRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Verification Failed", data.message || "Invalid OTP");
        return;
      }

      await signIn(data?.data?.token, data?.data?.refreshToken);
      handleVerifiedNavigation();
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to verify OTP");
    } finally {
      setLoading(false);
      verifyLockRef.current = false;
    }
  };

  const handleResend = async () => {
    if (resendLoading || resendLockRef.current) {
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email is required");
      return;
    }

    resendLockRef.current = true;
    setResendLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Could not resend OTP");
        return;
      }

      Alert.alert("Success", data.message || "OTP resent");
    } catch (error) {
      Alert.alert("Error", error.message || "Could not resend OTP");
    } finally {
      setResendLoading(false);
      resendLockRef.current = false;
    }
  };

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.cardShell}>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={34}
                  color={Colors.primary}
                />
              </View>

              <Text style={styles.title}>{headerText}</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit OTP to {email || "your email address"}.
              </Text>

              <Text style={styles.label}>OTP</Text>
              <View style={styles.inputBox}>
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerify}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                disabled={resendLoading}
              >
                <Text style={styles.resendText}>
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 32 : 36,
    left: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 74,
    paddingBottom: 32,
    minHeight: "100%",
  },
  cardShell: {
    width: "100%",
    maxWidth: 460,
  },
  card: {
    backgroundColor: "rgba(18, 10, 40, 0.14)",
    borderRadius: 26,
    padding: 18,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
    ...Platform.select({
      web: {
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        boxShadow: "0px 20px 60px rgba(0,0,0,0.30)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    marginBottom: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#2B124C",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#443A66",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2B124C",
    marginBottom: 8,
  },
  inputBox: {
    height: 54,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(18px) saturate(150%)",
        WebkitBackdropFilter: "blur(18px) saturate(150%)",
      },
    }),
  },
  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: "#1A1A2E",
    letterSpacing: 2,
  },
  button: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  resendBtn: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  resendText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
});
