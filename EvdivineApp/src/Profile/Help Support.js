import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PageContentSection from "../components/PageContentSection";

const faqs = [
  {
    id: "1",
    question: "How can I book a consultation?",
    answer:
      "You can select astrologer, choose chat/call/video call, select time slot and continue to payment.",
  },
  {
    id: "2",
    question: "How can I cancel my booking?",
    answer:
      "Go to My Booking page, select your upcoming booking and tap on Cancel button.",
  },
  {
    id: "3",
    question: "How do I add money to wallet?",
    answer:
      "Go to Payment Methods or Wallet section and choose UPI, card, or net banking to add money.",
  },
  {
    id: "4",
    question: "What if payment is failed?",
    answer:
      "If payment is deducted but booking is not confirmed, contact support with payment screenshot.",
  },
];

const normalizeContentText = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<\/?li[^>]*>/gi, "\n• ")
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<\/?ol[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const HelpSupport = ({ navigation }) => {
  const [openFaq, setOpenFaq] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert("Required", "Please write your message.");
      return;
    }

    Alert.alert("Success", "Your support request has been submitted.");
    setMessage("");
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@evdivine.com");
  };

  const openCall = () => {
    Linking.openURL("tel:+919876543210");
  };

  const openWhatsapp = () => {
    Linking.openURL("https://wa.me/919876543210");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#A34B1F" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={styles.headerTitle}>
            {remotePage?.title || "Help & Support"}
          </Text>
          <Text style={styles.headerSubtitle}>{heroSubtitle}</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="headset-outline" size={24} color="#fff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PageContentSection
          pageKey="help-support"
          titleFallback="Help & Support"
          subtitleFallback="We are here to help you with support and common questions."
          icon="chatbubbles-outline"
        />

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={openCall}>
            <View style={styles.contactIconBox}>
              <Ionicons name="call-outline" size={26} color="#A34B1F" />
            </View>
            <Text style={styles.contactTitle}>Call</Text>
            <Text style={styles.contactText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
            <View style={styles.contactIconBox}>
              <Ionicons name="mail-outline" size={26} color="#A34B1F" />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactText}>24/7 Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={openWhatsapp}>
            <View style={styles.contactIconBox}>
              <Ionicons name="logo-whatsapp" size={26} color="#A34B1F" />
            </View>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactText}>Chat Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Send Your Issue</Text>

          <View style={styles.inputBox}>
            <Ionicons name="document-text-outline" size={22} color="#A34B1F" />
            <TextInput
              style={styles.textArea}
              placeholder="Write your issue here..."
              placeholderTextColor="#999"
              multiline
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>Submit Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((item) => {
            const isOpen = openFaq === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={styles.faqItem}
                onPress={() => setOpenFaq(isOpen ? null : item.id)}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={22}
                    color="#A34B1F"
                  />
                </View>

                {isOpen ? (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoLeft}>
            <Ionicons name="time-outline" size={24} color="#A34B1F" />
            <View>
              <Text style={styles.infoTitle}>Support Time</Text>
              <Text style={styles.infoText}>Monday - Sunday, 9 AM - 9 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupport;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F4FA",
  },
  header: {
    backgroundColor: "#A34B1F",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 8,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    marginTop: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    elevation: 5,
    marginBottom: 18,
  },
  heroIconBox: {
    width: 82,
    height: 82,
    borderRadius: 30,
    backgroundColor: "#F1E4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginTop: 14,
  },
  heroText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  loadingText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 10,
    color: "#A34B1F",
    fontSize: 12,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  contactCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 3,
  },
  contactIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F1E4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
  },
  contactText: {
    fontSize: 11,
    color: "#777",
    marginTop: 3,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    elevation: 4,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginBottom: 14,
  },
  inputBox: {
    minHeight: 130,
    borderRadius: 18,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E8E1EF",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textArea: {
    flex: 1,
    minHeight: 105,
    fontSize: 15,
    color: "#111",
    marginLeft: 10,
    textAlignVertical: "top",
  },
  submitButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#A34B1F",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginLeft: 8,
  },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    elevation: 4,
    marginBottom: 18,
  },
  faqItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    elevation: 3,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
  },
  infoText: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },
});
