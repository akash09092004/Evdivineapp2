import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const notes = [
  {
    id: "1",
    title: "Call is ready",
    text: "Tap the call button below to start your audio consultation.",
  },
];

export default function CallSession({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate("MainTabs", { screen: "Booking" });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#2E160B" />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Call Consultation</Text>
            <Text style={styles.headerSub}>Audio consultation ready to start</Text>
          </View>

          <View style={styles.callBadge}>
            <Ionicons name="call" size={16} color="#F97316" />
            <Text style={styles.callBadgeText}>Call</Text>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: 20 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="call-outline" size={38} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Start your audio call</Text>
            <Text style={styles.heroSubText}>
              Connect with your advisor and discuss your questions in a live call.
            </Text>
          </View>

          {notes.map((item) => (
            <View key={item.id} style={styles.noteCard}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteText}>{item.text}</Text>
            </View>
          ))}

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor="#8E8AA8"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity style={styles.callBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callBtnText}>Start Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#2E160B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#2E160B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(249,115,22,0.18)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    color: "#B7A9DD",
    fontSize: 12,
    marginTop: 3,
  },
  callBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  callBadgeText: {
    color: "#F97316",
    fontWeight: "800",
    fontSize: 12,
  },
  keyboard: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  heroCard: {
    backgroundColor: "#1A0B3D",
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubText: {
    color: "#D8CFF3",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  noteTitle: {
    color: "#2B124C",
    fontSize: 15,
    fontWeight: "900",
  },
  noteText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  inputLabel: {
    color: "#2B124C",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFF7ED",
    color: "#2B124C",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#2E160B",
  },
  callBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  callBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
});
