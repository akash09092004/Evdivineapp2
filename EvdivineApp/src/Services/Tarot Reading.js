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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const TAROT_BANNER_IMAGE = require("../../assets/images/tarot-home.png");
const TAROT_BANNER_FALLBACK = {
  uri: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1400&q=80&auto=format&fit=crop",
};

const TarotReading = ({ navigation }) => {
  const [openFaq, setOpenFaq] = useState(null);
  const [bannerSource, setBannerSource] = useState(TAROT_BANNER_IMAGE);
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;

  const benefits = [
    "Love & Relationship Guidance",
    "Career Decision Clarity",
    "Marriage & Future Insights",
    "Emotional Healing Support",
    "Yes / No Question Reading",
    "Spiritual Direction",
  ];

  const consultationTypes = [
    {
      id: "chat",
      title: "Chat",
      price: "Rs. 199",
      time: "15 min",
      icon: "chatbubble-ellipses-outline",
      route: "ChatSession",
    },
    {
      id: "call",
      title: "Call",
      price: "Rs. 399",
      time: "20 min",
      icon: "call-outline",
      route: "CallSession",
    },
    {
      id: "video",
      title: "Video Call",
      price: "Rs. 699",
      time: "30 min",
      icon: "videocam-outline",
      route: "VideoCallSession",
    },
  ];

  const faqs = [
    {
      id: "1",
      question: "What is tarot reading?",
      answer:
        "Tarot reading uses tarot cards to give guidance about love, career, marriage, emotions and future possibilities.",
    },
    {
      id: "2",
      question: "Can I ask specific questions?",
      answer:
        "Yes, you can ask specific questions related to love, career, relationship, marriage, family or personal decisions.",
    },
    {
      id: "3",
      question: "Which consultation option is best?",
      answer:
        "Chat is best for quick questions, while call and video call are better for detailed guidance.",
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

        <Text style={styles.headerTitle}>Tarot Reading</Text>

        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
      >
        <View style={[styles.pageBody, isDesktop && styles.pageBodyDesktop]}>
          <View style={[styles.bannerCard, isDesktop && styles.bannerCardDesktop]}>
            <ImageBackground
              source={bannerSource}
              style={styles.bannerImage}
              imageStyle={styles.bannerImageInner}
              resizeMode="cover"
              onError={() => setBannerSource(TAROT_BANNER_FALLBACK)}
            >
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>Reveal Your Path</Text>
                <Text style={styles.bannerSubtitle}>
                  Get clear guidance through powerful tarot card reading
                </Text>
              </View>
            </ImageBackground>
          </View>

          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            <View style={styles.statBox}>
              <Ionicons name="star" size={22} color="#F6B800" />
              <Text style={styles.statNumber}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="people" size={22} color="#A34B1F" />
              <Text style={styles.statNumber}>14k+</Text>
              <Text style={styles.statLabel}>Readings</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="sparkles" size={22} color="#1C9B5E" />
              <Text style={styles.statNumber}>Clarity</Text>
              <Text style={styles.statLabel}>Guidance</Text>
            </View>
          </View>

          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
            <Text style={styles.sectionTitle}>About Tarot Reading</Text>

            <Text style={styles.description}>
              Tarot Reading helps you understand your current situation, emotional
              blocks, relationship energy, career choices and future possibilities.
              EvDivine tarot experts use card spreads and intuitive guidance to
              give you clear and practical answers.
            </Text>
          </View>

          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
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

          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
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

          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
            <Text style={styles.sectionTitle}>Why Choose Tarot?</Text>

            <View style={styles.whyItem}>
              <Ionicons name="albums-outline" size={24} color="#A34B1F" />
              <Text style={styles.whyText}>Card-based clear spiritual guidance</Text>
            </View>

            <View style={styles.whyItem}>
              <Ionicons name="heart-circle-outline" size={24} color="#A34B1F" />
              <Text style={styles.whyText}>Helpful for love and relationship issues</Text>
            </View>

            <View style={styles.whyItem}>
              <Ionicons name="compass-outline" size={24} color="#A34B1F" />
              <Text style={styles.whyText}>Supports better life and career decisions</Text>
            </View>
          </View>

          <View style={[styles.card, isDesktop && styles.cardDesktop]}>
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
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, isDesktop && styles.bottomBarDesktop]}>
        <View style={[styles.bottomBarInner, isDesktop && styles.bottomBarInnerDesktop]}>
          <View>
            <Text style={styles.bottomLabel}>Starting from</Text>
            <Text style={styles.bottomPrice}>Rs. 199</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation?.navigate("Booking", { service: "Tarot Reading" })}
          >
            <Ionicons name="calendar" size={21} color="#fff" />
            <Text style={styles.bookButtonText}>Book Tarot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TarotReading;

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
  scrollContentDesktop: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 130,
  },
  pageBody: {
    width: "100%",
  },
  pageBodyDesktop: {
    maxWidth: 1180,
  },

  bannerCard: {
    height: 210,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
    marginBottom: 16,
  },
  bannerCardDesktop: {
    height: 260,
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
    backgroundColor: "rgba(0,0,0,0.38)",
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

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statsRowDesktop: {
    gap: 14,
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
    fontSize: 15,
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
  cardDesktop: {
    padding: 22,
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
    flex: 1,
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
  bottomBarDesktop: {
    alignItems: "center",
  },
  bottomBarInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomBarInnerDesktop: {
    maxWidth: 1180,
    alignSelf: "center",
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
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
  },
});
