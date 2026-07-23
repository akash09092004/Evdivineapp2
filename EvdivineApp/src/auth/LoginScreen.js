import React, { useState } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import AuthBackground from "./components/AuthBackground";
import { API_BASE_URL } from "../config/api";

export default function LoginScreen({ navigation, route }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const redirectTo = route?.params?.redirectTo || "Profile";
  const redirectParams = route?.params?.redirectParams || undefined;
  const successMessage = route?.params?.successMessage || "";
  const shouldOpenMainTab = redirectTo === "Profile" || redirectTo === "Chat";
  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate("MainTabs", { screen: "Home" });
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const getLoginErrorMessage = (data = {}) => {
    const code = String(data?.code || "").toUpperCase();

    if (code === "USER_NOT_FOUND") {
      return "Username not found";
    }

    if (code === "INVALID_PASSWORD") {
      return "Password is incorrect";
    }

    return data?.message || "Something went wrong";
  };

  React.useEffect(() => {
    if (route?.params?.email) {
      setForm((prev) => ({ ...prev, email: route.params.email }));
    }
  }, [route?.params?.email]);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    console.log("[Login] submit", {
      email: form.email.trim(),
      passwordLength: form.password.trim().length,
      redirectTo,
    });

    setLoading(true);
    try {
      console.log("[Login] calling API:", `${API_BASE_URL}/api/auth/login`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password.trim(),
        }),
      });

      const data = await response.json();

      console.log("[Login] API response", {
        ok: response.ok,
        status: response.status,
        role: data?.data?.user?.role || "user",
        tokenExists: Boolean(data?.data?.token),
        user: data?.data?.user
          ? {
              id: data.data.user._id || data.data.user.id,
              email: data.data.user.email,
              role: data.data.user.role,
            }
          : null,
        message: data?.message,
      });

      if (response.status === 403 && data?.data?.otpRequired) {
        navigation?.replace("OtpVerification", {
          email: data?.data?.email || form.email.trim(),
          purpose: "login",
          redirectTo,
          successMessage: data.message || "Please verify OTP to continue.",
        });
        return;
      }

      if (!response.ok) {
        const code = String(data?.code || "").toUpperCase();
        const title =
          code === "USER_NOT_FOUND"
            ? "Username not found"
            : code === "INVALID_PASSWORD"
            ? "Password incorrect"
            : "Login Failed";
        Alert.alert(title, getLoginErrorMessage(data));
        return;
      }

      await signIn(data?.data?.token, data?.data?.refreshToken);
      console.log("[Login] token stored and auth set true");
      if (shouldOpenMainTab) {
        console.log("[Login] navigating to MainTabs ->", redirectTo);
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

      console.log("[Login] navigating to", redirectTo);
      navigation.reset({
        index: 0,
        routes: [{ name: redirectTo, params: redirectParams }],
      });
    } catch (error) {
      console.log("[Login] unexpected error", error);
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
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
              <View style={styles.logoBox}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Login to your EvDivine account
              </Text>

              {successMessage ? (
                <Text style={styles.successText}>{successMessage}</Text>
              ) : null}

              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputBox}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(text) => handleChange("email", text)}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => handleChange("password", text)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation?.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation?.navigate("Signup", {
                      redirectTo,
                      successMessage,
                    })
                  }
                >
                  <Text style={styles.linkText}> Sign Up</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.adminLink}
                onPress={() => navigation?.navigate("AdminLogin")}
              >
                <Text style={styles.adminLinkText}>Admin Login</Text>
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
    backgroundColor: "rgba(18, 10, 40, 0.18)",
    borderRadius: 26,
    padding: 18,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
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
  logoBox: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.88)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(138,82,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 22,
  },
  successText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inputBox: {
    height: 54,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
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
    color: "#FFFFFF",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    color: "#FACC15",
    fontWeight: "900",
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
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  bottomText: {
    color: "#D1D5DB",
  },
  linkText: {
    color: "#FACC15",
    fontWeight: "900",
  },
  adminLinkText: {
    color: "#D1D5DB",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  adminLink: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
