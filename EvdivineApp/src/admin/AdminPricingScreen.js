import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

const asNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export default function AdminPricingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    chatFreeMinutes: "5",
    chatRatePerMinute: "0",
  });

  const getToken = useCallback(() => AsyncStorage.getItem("adminToken"), []);

  const loadPricing = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/pricing`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Unable to load pricing");
    }

    const chatFreeSeconds = asNumber(data?.data?.chatFreeSeconds, 300);
    const chatRatePerMinute = asNumber(data?.data?.chatRatePerMinute, 0);

    setForm({
      chatFreeMinutes: String(Math.max(0, Math.round(chatFreeSeconds / 60))),
      chatRatePerMinute: String(chatRatePerMinute),
    });
  }, [getToken, navigation]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadPricing();
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load pricing");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPricing]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const minutes = asNumber(form.chatFreeMinutes, NaN);
    const rate = asNumber(form.chatRatePerMinute, NaN);

    if (!Number.isFinite(minutes) || minutes < 0) {
      Alert.alert(
        "Invalid value",
        "Free chat minutes non-negative number hona chahiye."
      );
      return;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      Alert.alert(
        "Invalid value",
        "Chat rate non-negative number hona chahiye."
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatFreeSeconds: Math.round(minutes * 60),
          chatRatePerMinute: rate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save pricing");
      }

      Alert.alert("Saved", "Free chat time update ho gaya hai.");
      await loadPricing();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to save pricing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading pricing settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chat Pricing</Text>
          <Text style={styles.subtitle}>Free minutes ko add ya minus karo</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.rowHead}>
            <View style={styles.iconWrap}>
              <Ionicons name="time-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Free Chat Time</Text>
              <Text style={styles.cardText}>
                User ko kitne minutes free chat milega, yahan set karo.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Free minutes</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor="#9C8FB9"
            keyboardType="numeric"
            value={form.chatFreeMinutes}
            onChangeText={(value) => setField("chatFreeMinutes", value)}
          />

          <Text style={styles.label}>Chat rate per minute</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#9C8FB9"
            keyboardType="numeric"
            value={form.chatRatePerMinute}
            onChangeText={(value) => setField("chatRatePerMinute", value)}
          />

          <View style={styles.hintBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#D8CFF3"
            />
            <Text style={styles.hintText}>
              5 minutes = 300 seconds. Save karte hi backend me
              `chatFreeSeconds` update ho jayega.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Settings"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#2E160B",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#fff",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "#D8CFF3",
    fontSize: 13,
    marginTop: 3,
  },
  body: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
  },
  rowHead: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  cardText: {
    color: "#D8CFF3",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: "#1A0B3D",
    color: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  hintBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  hintText: {
    flex: 1,
    color: "#D8CFF3",
    fontSize: 12,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});
