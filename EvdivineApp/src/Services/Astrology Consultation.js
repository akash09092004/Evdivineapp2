import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const AstrologyConsultation = ({ navigation, route }) => {
  const [openFaq, setOpenFaq] = useState(null);
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const selectedRashiName = route?.params?.rashiName || route?.params?.rashi || "";

  const benefits = [
    "Career & Job Guidance",
    "Love & Relationship Advice",
    "Marriage & Kundli Matching",
    "Business Growth Suggestions",
    "Health & Family Guidance",
    "Future Planning Support",
  ];

  const consultationTypes = [
    {
      id: "chat",
      title: "Chat",
      price: "₹199",
      time: "15 min",
      icon: "chatbubble-ellipses-outline",
      route: "ChatSession",
    },
    {
      id: "call",
      title: "Call",
      price: "₹399",
      time: "20 min",
      icon: "call-outline",
      route: "CallSession",
    },
    {
      id: "video",
      title: "Video Call",
      price: "₹599",
      time: "30 min",
      icon: "videocam-outline",
      route: "VideoCallSession",
    },
  ];

  const faqs = [
    {
      id: "1",
      question: "What is astrology consultation?",
      answer:
        "Astrology consultation gives guidance about career, love, marriage, business and life decisions based on birth details.",
    },
    {
      id: "2",
      question: "Do I need my birth details?",
      answer:
        "Yes, birth date, birth time and birth place help astrologer give more accurate guidance.",
    },
    {
      id: "3",
      question: "Can I choose chat, call or video?",
      answer:
        "Yes, you can choose chat, call or video call consultation as per your comfort.",
    },
  ];

  const openConsultation = (route) => {
    if (!route) {
      return;
    }

    if (!isAuthenticated) {
      navigation?.navigate("Login", {
        redirectTo: route,
        successMessage: "Please login or sign up to continue with this consultation.",
      });
      return;
    }

    navigation?.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#A34B1F" barStyle="light-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Astrology Consultation</Text>

        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.bannerCard}>
          <ImageBackground
            source={require("../../assets/images/astrology.png")}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageInner}
            resizeMode="cover"
          >
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Know Your Future</Text>
              <Text style={styles.bannerSubtitle}>
                Get expert astrology guidance from EvDivine
              </Text>
              {selectedRashiName ? (
                <View style={styles.rashiPill}>
                  <Ionicons name="sparkles-outline" size={14} color="#fff" />
                  <Text style={styles.rashiPillText}>{selectedRashiName}</Text>
                </View>
              ) : null}
            </View>
          </ImageBackground>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={22} color="#F6B800" />
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="people" size={22} color="#A34B1F" />
            <Text style={styles.statNumber}>12k+</Text>
            <Text style={styles.statLabel}>Consultations</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="shield-checkmark" size={22} color="#1C9B5E" />
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Secure</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About Astrology Consultation</Text>

          <Text style={styles.description}>
            Astrology Consultation helps you understand your life path, career,
            relationship, marriage, finance, business and personal problems.
            Our expert astrologers provide guidance based on your birth chart,
            planetary positions and spiritual knowledge.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Benefits</Text>

          <View style={styles.benefitsWrap}>
            {benefits.map((item, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#A34B1F" />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consultation Options</Text>

          {consultationTypes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.consultCard}
              activeOpacity={0.85}
              onPress={() => openConsultation(item.route)}
            >
              <View style={styles.consultLeft}>
                <View style={styles.consultIconBox}>
                  <Ionicons name={item.icon} size={24} color="#A34B1F" />
                </View>

                <View>
                  <Text style={styles.consultTitle}>{item.title}</Text>
                  <Text style={styles.consultTime}>{item.time}</Text>
                </View>
              </View>

              <View style={styles.priceBox}>
                <Text style={styles.priceText}>{item.price}</Text>
                <Text style={styles.bookText}>Book</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why Choose EvDivine?</Text>

          <View style={styles.whyItem}>
            <Ionicons name="person-circle-outline" size={24} color="#A34B1F" />
            <Text style={styles.whyText}>Experienced astrology experts</Text>
          </View>

          <View style={styles.whyItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#A34B1F" />
            <Text style={styles.whyText}>Private and secure consultation</Text>
          </View>

          <View style={styles.whyItem}>
            <Ionicons name="time-outline" size={24} color="#A34B1F" />
            <Text style={styles.whyText}>Quick booking and instant support</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>FAQs</Text>

          {faqs.map((item) => {
            const isOpen = openFaq === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.faqItem}
                activeOpacity={0.8}
                onPress={() => setOpenFaq(isOpen ? null : item.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={22}
                    color="#A34B1F"
                  />
                </View>

                {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Starting from</Text>
          <Text style={styles.bottomPrice}>₹199</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            navigation?.navigate("Booking", {
              service: "Astrology Consultation",
            })
          }
        >
          <Ionicons name="calendar" size={21} color="#fff" />
          <Text style={styles.bookButtonText}>Book Consultation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AstrologyConsultation;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F4FA",
  },

  header: {
    backgroundColor: "#A34B1F",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 8,
    paddingBottom: 22,
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
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 10,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  bannerCard: {
    height: 210,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
    marginBottom: 16,
  },

  bannerImage: {
    width: "100%",
    height: "100%",
  },

  bannerImageInner: {
    width: "100%",
    height: "100%",
  },

  bannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  bannerTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#fff",
  },

  bannerSubtitle: {
    fontSize: 14,
    color: "#F5F5F5",
    marginTop: 5,
    lineHeight: 20,
  },

  rashiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  rashiPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    elevation: 3,
  },

  statNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginTop: 5,
  },

  statLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },

  benefitsWrap: {
    gap: 10,
  },

  benefitItem: {
    backgroundColor: "#FBF7FF",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginLeft: 9,
  },

  consultCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  consultLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  consultIconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#F1E4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  consultTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  consultTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  priceBox: {
    alignItems: "flex-end",
  },

  priceText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#A34B1F",
  },

  bookText: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  whyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
  },

  whyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginLeft: 10,
  },

  faqItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },

  faqHeader: {
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

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 12,
  },

  bottomLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },

  bottomPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#A34B1F",
  },

  bookButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#A34B1F",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  bookButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },
});
