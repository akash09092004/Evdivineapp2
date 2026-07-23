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

export default function ResetPassword({ navigation }) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleReset = () => {
    if (!form.newPassword || !form.confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (form.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Alert.alert("Error", "Password not matched");
      return;
    }

    Alert.alert("Success", "Password reset successfully");
    navigation?.navigate("Login");
  };

  return (
    <AuthBackground>
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

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Create a new secure password for your account.
        </Text>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#999"
            secureTextEntry={!showNew}
            value={form.newPassword}
            onChangeText={(text) => handleChange("newPassword", text)}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons
              name={showNew ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirm}
            value={form.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.navigate("Login")}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
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
    padding: 18,
    paddingVertical: 32,
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
    marginBottom: 22,
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
    marginBottom: 14,
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
  },
  button: {
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  backBtn: {
    alignItems: "center",
    marginTop: 18,
  },
  backText: {
    color: Colors.primaryLight,
    fontWeight: "900",
  },
});
