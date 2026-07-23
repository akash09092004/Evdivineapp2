import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import AuthBackground from "./components/AuthBackground";
import { API_BASE_URL } from "../config/api";

const COUNTRY_CODES = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA / Canada" },
  { code: "+44", label: "United Kingdom" },
  { code: "+61", label: "Australia" },
  { code: "+971", label: "UAE" },
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function SignupScreen({ navigation, route }) {
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const redirectTo = route?.params?.redirectTo || "Profile";
  const successMessage = route?.params?.successMessage || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate("Login", {
      redirectTo,
      successMessage,
    });
  };

  const handleSignup = async () => {
    if (!acceptedTerms) {
      Alert.alert(
        "Terms Required",
        "Please accept the Terms & Conditions before signing up."
      );
      return;
    }

    if (!form.name || !form.email || !form.phone || !form.password || !form.gender) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(
          form.email.trim().toLowerCase()
        )}`
      );

      const checkData = await checkResponse.json().catch(() => ({}));

      if (checkResponse.ok && checkData?.data?.exists) {
        navigation?.replace("Login", {
          email: form.email.trim().toLowerCase(),
          redirectTo,
          successMessage:
            "This email is already registered. Please login instead.",
        });
        return;
      }

      const phoneCheckResponse = await fetch(
        `${API_BASE_URL}/api/auth/check-phone?phone=${encodeURIComponent(
          `${countryCode} ${form.phone.trim()}`
        )}`
      );
      const phoneCheckData = await phoneCheckResponse.json().catch(() => ({}));

      if (phoneCheckResponse.ok && phoneCheckData?.data?.exists) {
        Alert.alert(
          "Error",
          "This phone number is already registered. Please use a different number or login."
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: `${countryCode} ${form.phone.trim()}`.trim(),
          gender: String(form.gender || "Other").toLowerCase(),
          password: form.password.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        navigation?.replace("Login", {
          email: form.email.trim().toLowerCase(),
          redirectTo,
          successMessage:
            data.message || "Account already exists. Please login instead.",
        });
        return;
      }

      if (!response.ok) {
        Alert.alert("Error", data.message || "Something went wrong");
        return;
      }

      navigation?.replace("OtpVerification", {
        email: form.email.trim().toLowerCase(),
        purpose: "signup",
        redirectTo,
        successMessage:
          "Account created successfully. Please verify OTP to continue.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
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

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join EvDivine and start your journey
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#FFFFFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#D1D5DB"
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#D1D5DB"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
              />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setGenderOpen(false);
                  setCountryCodeOpen((prev) => !prev);
                }}
              >
                <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                <Text style={styles.countryBtnText}>{countryCode}</Text>
                <Ionicons
                  name={countryCodeOpen ? "chevron-up-outline" : "chevron-down-outline"}
                  size={16}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={[styles.inputBox, styles.phoneInputBox]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                />
              </View>
            </View>

            {countryCodeOpen ? (
              <View style={styles.dropdownBox}>
                {COUNTRY_CODES.map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.dropdownItem}
                    activeOpacity={0.85}
                    onPress={() => {
                      setCountryCode(item.code);
                      setCountryCodeOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownCode}>{item.code}</Text>
                    <Text style={styles.dropdownLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={styles.inputBox}
              activeOpacity={0.85}
              onPress={() => {
                setCountryCodeOpen(false);
                setGenderOpen((prev) => !prev);
              }}
            >
              <Ionicons name="male-female-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.input, !form.gender && styles.placeholderText]}>
                {form.gender || "Select gender"}
              </Text>
              <Ionicons
                name={genderOpen ? "chevron-up-outline" : "chevron-down-outline"}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {genderOpen ? (
              <View style={styles.dropdownBox}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    activeOpacity={0.85}
                    onPress={() => {
                      handleChange("gender", option);
                      setGenderOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownLabel}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#FFFFFF"
              />
              <TextInput
                style={styles.input}
                placeholder="Create password"
                placeholderTextColor="#D1D5DB"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!acceptedTerms || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading || !acceptedTerms}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.termsRow}>
              <TouchableOpacity
                style={styles.checkboxBtn}
                onPress={() => setAcceptedTerms((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                accessibilityLabel="Accept Terms and Conditions"
              >
                <Ionicons
                  name={acceptedTerms ? "checkbox" : "square-outline"}
                  size={22}
                  color={acceptedTerms ? "#FACC15" : "#D1D5DB"}
                />
              </TouchableOpacity>

              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation?.navigate("TermsCondition")}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation?.navigate("Login")}>
                <Text style={styles.linkText}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 20,
    minHeight: "100%",
  },
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
  cardShell: {
    width: "100%",
    maxWidth: 400,
  },
  card: {
    backgroundColor: "rgba(18, 10, 40, 0.18)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  inputBox: {
    height: 46,
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
  placeholderText: {
    color: "#D1D5DB",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  countryBtn: {
    minWidth: 84,
    height: 46,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  countryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginHorizontal: 8,
  },
  phoneInputBox: {
    flex: 1,
    marginBottom: 0,
  },
  dropdownBox: {
    marginTop: -6,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "rgba(18, 10, 40, 0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  dropdownItem: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  dropdownCode: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  dropdownLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  button: {
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  checkboxBtn: {
    marginRight: 10,
    padding: 2,
  },
  termsText: {
    flex: 1,
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    color: "#FACC15",
    fontWeight: "900",
    textDecorationLine: "underline",
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
});
