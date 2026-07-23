// src/screens/ContactUs.js

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import OfficeLocationSection from "../components/contact/OfficeLocationSection";
import { fetchPageContentByKey } from "../Services/pageContentApi";
import PageContentSection from "../components/PageContentSection";
import { submitContactMessage } from "../Services/contactMessageApi";

const COUNTRY_CODES = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA" },
  { code: "+44", label: "UK" },
  { code: "+971", label: "UAE" },
  { code: "+61", label: "Australia" },
  { code: "+86", label: "China" },
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

export default function ContactUs({ navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = width >= 900;
  const isTablet = width >= 700;
  const [remotePage, setRemotePage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchPageContentByKey({ pageKey: "contact-us" });
        if (!mounted) return;
        setRemotePage(response?.pageContent || null);
      } catch {
        if (!mounted) return;
        setRemotePage(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = remotePage?.title || "Contact Us";
  const heroSubtitle =
    remotePage?.description ||
    "We're here to help! Reach out to us for any questions, support or guidance.";
  const remoteCopy = useMemo(
    () =>
      normalizeContentText(remotePage?.content || "") ||
      "Reach out through the contact details below and our team will respond as soon as possible.",
    [remotePage?.content]
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert("Required", "Name, Email aur Message fill karo");
      return;
    }

    try {
      setSending(true);
      await submitContactMessage({
        ...form,
        phone: `${countryCode} ${String(form.phone || "").trim()}`.trim(),
      });
      Alert.alert("Success", "Your message has been sent successfully!");
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setCountryCode(COUNTRY_CODES[0].code);
      setCountryCodeOpen(false);
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const openScreen = (target) => {
    if (target.type === "tab") {
      navigation.navigate("MainTabs", { screen: target.name });
      return;
    }

    navigation.navigate(target.name);
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs", { screen: "Home" });
  };

  const quickLinks = [
    { label: "Home", target: { type: "tab", name: "Home" } },
    { label: "About Us", target: { type: "tab", name: "About" } },
    { label: "Our Services", target: { type: "tab", name: "Services" } },
    { label: "Psychics", target: { type: "tab", name: "Home" } },
    { label: "Blog", target: { type: "tab", name: "Blog" } },
    { label: "Contact Us", target: { type: "stack", name: "contactus" } },
  ];

  const serviceLinks = [
    { label: "Tarot Reading", target: { type: "stack", name: "TarotReading" } },
    {
      label: "Astrology",
      target: { type: "stack", name: "AstrologyConsultation" },
    },
    {
      label: "Psychic Reading",
      target: { type: "stack", name: "PsychicReading" },
    },
    { label: "Numerology", target: { type: "stack", name: "Numerology" } },
    {
      label: "Vastu Consultation",
      target: { type: "stack", name: "VastuConsultation" },
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>✦</Text>
          <Text style={styles.logoText}>EvDivine</Text>
        </View>

        {isWeb && (
          <View style={styles.navLinks}>
            <Text style={styles.navItem}>Home</Text>
            <Text style={styles.navItem}>Services⌄</Text>
            <Text style={styles.navItem}>About Us</Text>
            <Text style={styles.navItem}>Psychics</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openScreen({ type: "tab", name: "Blog" })}
            >
              <Text style={styles.navItem}>Blog</Text>
            </TouchableOpacity>
            <Text style={styles.activeNav}>Contact Us</Text>
          </View>
        )}

        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroSub}>{heroSubtitle}</Text>

        <View style={styles.heroDivider}>
          <View style={styles.line} />
          <Ionicons name="star" size={18} color="#B55CFF" />
          <View style={styles.line} />
        </View>

        <Text style={styles.zodiac}>✧ ✦ ✧ ✦ ✧</Text>
      </View>

      <View style={styles.contentNote}>
        <Text style={styles.contentNoteTitle}>Latest Contact Content</Text>
        <Text style={styles.contentNoteText}>{remoteCopy}</Text>
        {loading ? (
          <Text style={styles.contentNoteMeta}>Loading page content...</Text>
        ) : null}
      </View>

      <PageContentSection
        pageKey="contact-us"
        titleFallback="Contact Us"
        subtitleFallback="Reach out to us for questions, support or guidance."
        icon="mail-outline"
      />

      {/* Contact Cards */}
      <View
        style={[
          styles.contactCards,
          { flexDirection: isTablet ? "row" : "column" },
        ]}
      >
        <InfoCard
          icon="location"
          title="Our Location"
          text="Jyotish Sadan, 9/959, Sector 9, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India"
          color="#C06A3B"
        />
        <InfoCard
          icon="call"
          title="Call Us"
          text="+91 99996 29808"
          sub="Mon - Sat | 9AM - 6PM"
          color="#31B65D"
          onPress={() => openLink("tel:+919999629808")}
        />
        <InfoCard
          icon="mail"
          title="Email Us"
          text="support@evdivine.com"
          sub="We reply within 24 hours"
          color="#2F80ED"
          onPress={() => openLink("mailto:support@evdivine.com")}
        />
        <InfoCard
          icon="time"
          title="Working Hours"
          text="Mon - Sat"
          sub="9:00 AM - 6:00 PM"
          color="#F97316"
        />
      </View>

      {/* Map + Form */}
      <View
        style={[styles.middleRow, { flexDirection: isWeb ? "row" : "column" }]}
      >
        <OfficeLocationSection
          styles={styles}
          address="Jyotish Sadan, 9/959, Sector 9, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India"
        />

        <View style={styles.whiteBox}>
          <View style={styles.titleRow}>
            <Ionicons name="paper-plane-outline" size={22} color="#C06A3B" />
            <Text style={styles.boxTitle}>Send Us a Message</Text>
          </View>

          <View
            style={[
              styles.inputRow,
              { flexDirection: isWeb ? "row" : "column" },
            ]}
          >
            <InputIcon icon="person-outline">
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={form.name}
                onChangeText={(t) => handleChange("name", t)}
              />
            </InputIcon>

            <InputIcon icon="mail-outline">
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(t) => handleChange("email", t)}
              />
            </InputIcon>
          </View>

          <View style={styles.phoneGroup}>
            <TouchableOpacity
              style={styles.countryCodeBox}
              activeOpacity={0.85}
              onPress={() => setCountryCodeOpen((prev) => !prev)}
            >
              <Ionicons name="call-outline" size={18} color="#7C879E" />
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons
                name={
                  countryCodeOpen
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={16}
                color="#7C879E"
              />
            </TouchableOpacity>

            <View style={styles.phoneInputWrap}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(t) => handleChange("phone", t)}
              />
            </View>
          </View>

          {countryCodeOpen ? (
            <View style={styles.countryDropdown}>
              {COUNTRY_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.countryOption,
                    countryCode === item.code && styles.countryOptionActive,
                  ]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryCodeOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.countryOptionCode,
                      countryCode === item.code &&
                        styles.countryOptionCodeActive,
                    ]}
                  >
                    {item.code}
                  </Text>
                  <Text
                    style={[
                      styles.countryOptionLabel,
                      countryCode === item.code &&
                        styles.countryOptionLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <InputIcon icon="chevron-down-outline">
            <TextInput
              style={styles.input}
              placeholder="Select Subject"
              value={form.subject}
              onChangeText={(t) => handleChange("subject", t)}
            />
          </InputIcon>

          <View style={styles.textAreaBox}>
            <Ionicons name="create-outline" size={20} color="#7C879E" />
            <TextInput
              style={styles.textArea}
              placeholder="Your Message"
              multiline
              value={form.message}
              onChangeText={(t) => handleChange("message", t)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={sending}
          >
            <Text style={styles.submitText}>
              {sending ? "Sending..." : "Send Message"}
            </Text>
            <Ionicons name="paper-plane-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Features */}
      <View
        style={[styles.features, { flexDirection: isWeb ? "row" : "column" }]}
      >
        <Feature
          icon="headset"
          title="24/7 Support"
          text="We are always here for you anytime."
        />
        <Feature
          icon="shield-checkmark-outline"
          title="Trusted & Secure"
          text="Your information is 100% safe with us."
        />
        <Feature
          icon="people-outline"
          title="Expert Guidance"
          text="Connect with verified psychics & experts."
        />
        <Feature
          icon="heart-outline"
          title="Customer First"
          text="Your satisfaction is our top priority."
        />
      </View>

      {/* Social */}
      <View style={styles.socialSection}>
        <View style={styles.followRow}>
          <View style={styles.smallLine} />
          <Text style={styles.followTitle}>Follow Us On</Text>
          <View style={styles.smallLine} />
        </View>

        <View style={styles.socialRow}>
          <Social
            name="facebook"
            color="#1877F2"
            url="https://www.facebook.com/profile.php?id=61591671718130&sk=directory_contact_info&fb_profile_edit_entry_point=%7B%22feature%22%3A%22profile_directory%22%2C%22click_point%22%3A%22pencil_edit_directory_section%22%2C%22additional_metadata%22%3A%7B%22section_type%22%3A%22contact_info%22%7D%7D"
          />
          <Social
            name="linkedin"
            color="#0077B5"
            url="https://www.linkedin.com/company/evdivine"
          />
          <Social
            name="instagram"
            color="#E1306C"
            url="https://instagram.com"
          />
          <Social
            name="pinterest"
            color="#E60023"
            url="http://www.pinterest.com/evdivineastro"
          />
          <Social name="twitter" color="#1DA1F2" url="https://twitter.com" />
          <Social
            name="youtube-play"
            color="#FF0000"
            url="https://youtube.com"
          />
          <Social
            name="whatsapp"
            color="#25D366"
            url="https://wa.me/919876543210"
          />
        </View>

        <Text style={styles.socialText}>
          Stay connected for latest updates, offers and spiritual insights.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View
          style={[
            styles.footerGrid,
            { flexDirection: isWeb ? "row" : "column" },
          ]}
        >
          <View style={styles.footerCol}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>✦</Text>
              <Text style={styles.footerLogo}>EvDivine</Text>
            </View>
            <Text style={styles.footerText}>{remoteCopy}</Text>
          </View>

          <FooterList
            title="Quick Links"
            items={quickLinks}
            onPressItem={openScreen}
          />
          <FooterList
            title="Our Services"
            items={serviceLinks}
            onPressItem={openScreen}
          />

          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>Contact Info</Text>
            <Text style={styles.footerText}>
              📍 123 Divine Street, Near Lotus Temple, New Delhi
            </Text>
            <Text style={styles.footerText}>📞 +91 98765 43210</Text>
            <Text style={styles.footerText}>✉ support@evdivine.com</Text>
          </View>
        </View>

        <View style={styles.copyright}>
          <Text style={styles.copyText}>
            © 2025 EvDivine. All Rights Reserved.
          </Text>
          <Text style={styles.copyText}>
            Privacy Policy | Terms & Conditions
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoCard({ icon, title, text, sub, color, onPress }) {
  return (
    <TouchableOpacity
      style={styles.infoCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{text}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function InputIcon({ icon, children }) {
  return (
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={20} color="#7C879E" />
      {children}
    </View>
  );
}

function Feature({ icon, title, text }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={28} color="#C06A3B" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function Social({ name, color, url }) {
  return (
    <TouchableOpacity
      style={styles.socialIcon}
      onPress={() => Linking.openURL(url)}
    >
      <FontAwesome name={name} size={25} color={color} />
    </TouchableOpacity>
  );
}

function FooterList({ title, items, onPressItem }) {
  return (
    <View style={styles.footerCol}>
      <Text style={styles.footerTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.75}
          onPress={() => onPressItem(item.target)}
        >
          <Text style={styles.footerLink}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },

  navbar: {
    height: 70,
    backgroundColor: "#FFF7E9",
    paddingHorizontal: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 75, 31, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(163, 75, 31, 0.30)",
    marginRight: 10,
  },

  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logoIcon: {
    fontSize: 34,
    color: "#C06A3B",
  },

  logoText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
  },

  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },

  navItem: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  activeNav: {
    color: "#C06A3B",
    fontSize: 15,
    fontWeight: "800",
    borderBottomWidth: 2,
    borderBottomColor: "#C06A3B",
    paddingBottom: 12,
  },

  bookBtn: {
    backgroundColor: "#C06A3B",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 7,
  },

  bookText: {
    color: "#fff",
    fontWeight: "800",
  },

  hero: {
    backgroundColor: "#2E160B",
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  heroTitle: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
  },

  heroSub: {
    color: "#fff",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 520,
  },

  heroDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 14,
  },

  line: {
    width: 95,
    height: 2,
    backgroundColor: "#C06A3B",
  },

  zodiac: {
    position: "absolute",
    left: 60,
    top: 40,
    color: "#A34B1F",
    fontSize: 70,
    opacity: 0.25,
  },

  contentNote: {
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },

  contentNoteTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#4E2513",
    marginBottom: 6,
  },

  contentNoteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#5C4331",
  },

  contentNoteMeta: {
    marginTop: 8,
    fontSize: 11,
    color: "#A34B1F",
    fontWeight: "700",
  },

  contactCards: {
    marginTop: -32,
    paddingHorizontal: 50,
    gap: 18,
  },

  infoCard: {
    flex: 1,
    minHeight: 215,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "900",
    color: "#10172A",
    textAlign: "center",
  },

  cardText: {
    marginTop: 10,
    fontSize: 14,
    color: "#243047",
    textAlign: "center",
    lineHeight: 22,
  },

  cardSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
  },

  middleRow: {
    paddingHorizontal: 50,
    marginTop: 26,
    gap: 18,
  },

  whiteBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 18,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  boxTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#10172A",
  },

  mapBox: {
    height: 360,
    borderRadius: 8,
    backgroundColor: "#EAF2FA",
    borderWidth: 1,
    borderColor: "#D8E1EC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  mapFakeText: {
    position: "absolute",
    top: 40,
    left: 120,
    fontSize: 16,
    color: "#1F6FB2",
    fontWeight: "700",
  },

  mapRoad: {
    position: "absolute",
    top: 105,
    left: 70,
    color: "#1A73E8",
    fontSize: 15,
  },

  mapRoadRight: {
    position: "absolute",
    top: 120,
    right: 35,
    color: "#159447",
    fontSize: 15,
  },

  mapActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    width: "100%",
  },

  mapActionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    flexGrow: 1,
  },

  mapActionPrimary: {
    backgroundColor: "#7C3AED",
  },

  mapActionSoft: {
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.18)",
  },

  mapActionPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  mapActionSoftText: {
    color: "#A34B1F",
    fontSize: 13,
    fontWeight: "800",
  },

  locationNoteBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locationNoteText: {
    flex: 1,
    color: "#7C4C35",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  locationResultBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(49,182,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(49,182,93,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locationResultText: {
    flex: 1,
    color: "#256A3C",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  inputRow: {
    gap: 12,
  },

  inputBox: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 7,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },

  phoneGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
    marginBottom: 14,
    zIndex: 10,
  },

  countryCodeBox: {
    minWidth: 116,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 7,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  countryCodeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  phoneInputWrap: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 7,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  phoneInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#111827",
  },

  countryDropdown: {
    marginTop: -6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  countryOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  countryOptionActive: {
    backgroundColor: "#F4ECFF",
  },

  countryOptionCode: {
    width: 56,
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  countryOptionCodeActive: {
    color: "#8B2BE2",
  },

  countryOptionLabel: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },

  countryOptionLabelActive: {
    color: "#8B2BE2",
  },

  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#111827",
  },

  textAreaBox: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingTop: 13,
    marginBottom: 18,
    flexDirection: "row",
    gap: 10,
  },

  textArea: {
    flex: 1,
    minHeight: 85,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#8B2BE2",
    height: 48,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  submitBtnDisabled: {
    opacity: 0.72,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  features: {
    marginHorizontal: 50,
    marginTop: 26,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 24,
    gap: 18,
    elevation: 4,
  },

  featureItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  featureIcon: {
    width: 58,
    height: 58,
    borderRadius: 35,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#10172A",
  },

  featureText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 5,
    lineHeight: 20,
  },

  socialSection: {
    alignItems: "center",
    paddingVertical: 30,
  },

  followRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  smallLine: {
    width: 42,
    height: 2,
    backgroundColor: "#C06A3B",
  },

  followTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#10172A",
  },

  socialRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 18,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  socialIcon: {
    width: 56,
    height: 56,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  socialText: {
    marginTop: 18,
    color: "#334155",
    textAlign: "center",
    fontSize: 14,
  },

  footer: {
    backgroundColor: "#4A2516",
    borderTopWidth: 4,
    borderTopColor: "#C06A3B",
    paddingHorizontal: 50,
    paddingTop: 30,
    borderRadius: 24,
  },

  footerGrid: {
    gap: 40,
  },

  footerCol: {
    flex: 1,
  },

  footerLogo: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },

  footerText: {
    color: "#D6D5E6",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  footerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },

  footerLink: {
    color: "#D6D5E6",
    fontSize: 14,
    marginBottom: 9,
  },

  copyright: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  copyText: {
    color: "#D6D5E6",
    fontSize: 13,
  },
});
