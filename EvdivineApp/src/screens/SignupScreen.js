import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ResponsiveScreen from "../components/ResponsiveScreen";
import { Colors } from "../theme/colors";
import GradientButton from "../components/GradientButton";
import { API_BASE_URL } from "../config/api";

export default function SignupScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const redirectTo = route?.params?.redirectTo || "Profile";

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSignup = async () => {
    setMessage("");

    if (!agreed) {
      showMessage("Please agree to Terms & Conditions.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.password) {
      showMessage("Please fill in all the fields.");
      return;
    }

    if (payload.password.length < 6) {
      showMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(payload.email)}`
      );
      const checkRaw = await checkResponse.text();
      let checkData = {};

      if (checkRaw) {
        try {
          checkData = JSON.parse(checkRaw);
        } catch {
          checkData = { message: checkRaw };
        }
      }

      if (checkResponse.ok && checkData.exists) {
        showMessage("This email is already registered. Please login instead.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data = {};

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: raw };
        }
      }

      if (response.status === 409) {
        navigation.replace("Login", {
          email: payload.email,
          redirectTo,
          successMessage: data.message || "Account already exists. Please login instead.",
        });
        return;
      }

      if (!response.ok) {
        if (data.message === "User already exists") {
          showMessage("This email is already registered. Please login instead.");
          return;
        }

        showMessage(data.message || "Something went wrong");
        return;
      }

      navigation.replace("OtpVerification", {
        email: payload.email,
        purpose: "signup",
        redirectTo,
        successMessage: "Account created successfully. Please verify OTP to continue.",
        otp: data?.data?.otp || "",
      });
    } catch (error) {
      showMessage(error.message || "Unable to complete signup right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveScreen backgroundColor={Colors.surface}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 10 : 0}
          style={styles.flex}
        >
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>{"<"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          >
            <View style={styles.cardShell}>
              <View style={styles.card}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join EvDivine and start your journey</Text>

                {message ? (
                  <View
                    style={[
                      styles.messageBox,
                      messageType === "success" ? styles.messageSuccess : styles.messageError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        messageType === "success"
                          ? styles.messageTextSuccess
                          : styles.messageTextError,
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                ) : null}

                {[
                  {
                    key: "name",
                    label: "Full Name",
                    placeholder: "Enter your name",
                    type: "default",
                  },
                  {
                    key: "email",
                    label: "Email Address",
                    placeholder: "Enter your email",
                    type: "email-address",
                  },
                  {
                    key: "phone",
                    label: "Phone Number",
                    placeholder: "Enter your phone number",
                    type: "phone-pad",
                  },
                ].map((field) => (
                  <View key={field.key} style={styles.formGroup}>
                    <Text style={styles.label}>{field.label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={field.type}
                      autoCapitalize={field.key === "name" ? "words" : "none"}
                      value={form[field.key]}
                      onChangeText={(val) => setForm({ ...form, [field.key]: val })}
                    />
                  </View>
                ))}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Create a password"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPw}
                      value={form.password}
                      onChangeText={(val) => setForm({ ...form, password: val })}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                      <Text>{showPw ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setAgreed(!agreed)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                    {agreed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkText}>
                    I agree to the{" "}
                    <Text style={styles.checkLink}>Terms & Conditions</Text> and{" "}
                    <Text style={styles.checkLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <GradientButton
                  title={loading ? "Creating account..." : "Sign Up"}
                  onPress={handleSignup}
                  loading={loading}
                />

                <Text style={styles.footer}>
                  Already have an account?{" "}
                  <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
                    Login
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 18, paddingVertical: 8 },
  back: { fontSize: 28, color: Colors.text, fontWeight: "300" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 4,
    alignItems: "center",
  },
  cardShell: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  card: {
    width: "100%",
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: "rgba(78, 35, 18, 0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(24px) saturate(145%)",
        WebkitBackdropFilter: "blur(24px) saturate(145%)",
        boxShadow: "0px 18px 48px rgba(0,0,0,0.28)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 18,
    textAlign: "center",
  },
  messageBox: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: "rgba(221,51,51,0.08)",
    borderColor: "rgba(221,51,51,0.28)",
  },
  messageSuccess: {
    backgroundColor: "rgba(37,211,102,0.10)",
    borderColor: "rgba(37,211,102,0.28)",
  },
  messageText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  messageTextError: {
    color: Colors.danger,
  },
  messageTextSuccess: {
    color: Colors.success,
  },
  formGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  passwordInput: {
    paddingRight: 54,
  },
  inputWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: "white", fontSize: 12, fontWeight: "700" },
  checkText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 20 },
  checkLink: { color: Colors.primary, fontWeight: "700" },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 14,
  },
  footerLink: { color: Colors.primary, fontWeight: "700" },
});
