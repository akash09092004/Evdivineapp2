import React, { useEffect, useMemo, useState } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "../components/LinearGradient";
import ResponsiveScreen from "../components/ResponsiveScreen";
import GradientButton from "../components/GradientButton";
import { fetchPageContentByKey } from "../Services/pageContentApi";

// Design tokens
const C = {
  bg: "#F8E8C7",
  surface: "#FFF7E9",
  surfaceAlt: "#F4E2BC",
  surfaceDeep: "#E9D3A2",
  primary: "#A34B1F",
  primaryLight: "#E9A64D",
  accent: "#C06A3B",
  gold: "#A34B1F",
  textPrimary: "#4E2513",
  textSec: "#8B5F49",
  textMuted: "#A37B62",
  border: "rgba(163,75,31,0.16)",
  borderStrong: "rgba(163,75,31,0.24)",
};

const BADGES = ["Astrology", "Tarot Reading", "Vastu", "Numerology"];

const BIO = [
  "I am a second-generation psychic intuitive and clairvoyant. My gift was blessed to me by my grandmother and grandfather, and I began helping people from childhood.",
  "Over the years I have shared readings that people found useful for clarity, guidance, and peace of mind.",
  "I combine astrology, psychic insight, and tarot card reading depending on what each client needs.",
];

const EXPERTISE = [
  { icon: "🎴", title: "Tarot Card Reading", sub: "Cards pulled and read for your path" },
  { icon: "🔮", title: "Psychic Reading", sub: "Deep intuitive connection and insight" },
  { icon: "🏠", title: "Vastu", sub: "Positive energy for home and workspace" },
  { icon: "🔢", title: "Numerology", sub: "Guidance through the power of numbers" },
  { icon: "⭐", title: "Astrology", sub: "Birth chart based readings" },
  { icon: "🧘", title: "Meditation", sub: "Calm the mind, align the spirit" },
  { icon: "🕊️", title: "Spiritual Voice", sub: "Listening to your soul's guidance" },
  { icon: "👼", title: "Angel Connection", sub: "Direct connection with angels" },
  { icon: "🙏", title: "Personal Advisor", sub: "One-on-one life guidance" },
];

const HELP_AREAS = [
  "Love",
  "Relationship",
  "Marriage",
  "Divorce",
  "Reunite",
  "Career",
  "Business Ups & Downs",
  "New Project",
  "Service",
  "Promotion",
  "Education",
  "Affair",
  "Serious Relation",
  "Health",
  "Wealth",
  "Good Luck Date",
  "Family Problem",
];

const SERVICES = [
  {
    icon: "🎴",
    title: "Tarot Card Reading",
    sub: "Share your name, date of birth and current location. I will shuffle and pull the cards to give you the best reading possible.",
  },
  {
    icon: "🔮",
    title: "Psychic Reading",
    sub: "Share your name, date of birth, current location and specific questions you have.",
  },
  {
    icon: "⭐",
    title: "Astrology Reading",
    sub: "Name, date of birth, birth place, accurate birth time and your questions help me guide you better.",
  },
  {
    icon: "🏠",
    title: "Vastu Reading",
    sub: "Share details of your house, shop, commercial place, or factory and I will guide you with practical changes.",
  },
  {
    icon: "🙏",
    title: "Counselling for Life Issues",
    sub: "Share your issues along with the details of related people and I will help you work toward a peaceful future.",
  },
];

const TAB_BAR_SPACER = 120;

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

function SectionTitle({ label }) {
  return (
    <View style={s.secTitleRow}>
      <View style={s.secDot} />
      <Text style={s.secTitle}>{label}</Text>
    </View>
  );
}

export default function AboutScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const tabBarSpacer = isDesktop ? 28 : TAB_BAR_SPACER;
  const expertiseCardWidth = (width - 32 - 8) / 2;
  const [remotePage, setRemotePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchPageContentByKey({ pageKey: "about-us" });
        if (!mounted) return;
        setRemotePage(response?.pageContent || null);
      } catch (fetchError) {
        if (!mounted) return;
        setRemotePage(null);
        setError(fetchError?.message || "Unable to load about page");
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

  const heroTitle = remotePage?.title || "About Me";
  const heroSubtitle =
    remotePage?.description || "Psychic · Astro Guru · Spiritual Personal Advisor";
  const pageBody = useMemo(() => {
    const remoteText = normalizeContentText(remotePage?.content || "");
    return remoteText || BIO.join("\n\n");
  }, [remotePage?.content]);

  return (
    <ResponsiveScreen backgroundColor={C.bg}>
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>About Me</Text>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarSpacer }}
        >
          <LinearGradient
            colors={[C.surfaceAlt, C.surfaceDeep, C.surfaceAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroBand}
          >
            <View style={s.glowTR} />
            <View style={s.glowBL} />

            <View style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={s.avatarImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={s.heroName}>{heroTitle}</Text>
            <Text style={s.heroRole}>{heroSubtitle}</Text>

            {loading ? (
              <View style={s.loadingPill}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={s.loadingText}>Loading about content...</Text>
              </View>
            ) : null}

            {error ? (
              <View style={s.errorPill}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={s.badgeRow}>
              {BADGES.map((b, i) => (
                <View key={i} style={s.badge}>
                  <Text style={s.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <LinearGradient colors={[C.surfaceAlt, C.bg]} style={{ height: 20 }} />

          <View style={s.body}>
            <SectionTitle label="My Story" />
            <View style={s.storyCard}>
              <Text style={s.bodyText}>{pageBody}</Text>
              {remotePage?.keywords ? (
                <Text style={s.keywordText}>Keywords: {remotePage.keywords}</Text>
              ) : null}
            </View>

            <SectionTitle label="My Expertise" />
            <View style={s.approachGrid}>
              {EXPERTISE.map((a, i) => (
                <View key={i} style={[s.approachCard, { width: expertiseCardWidth }]}>
                  <Text style={s.apIcon}>{a.icon}</Text>
                  <Text style={s.apTitle}>{a.title}</Text>
                  <Text style={s.apSub}>{a.sub}</Text>
                </View>
              ))}
            </View>

            <SectionTitle label="Areas I Help With" />
            <View style={s.chipWrap}>
              {HELP_AREAS.map((h, i) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipText}>{h}</Text>
                </View>
              ))}
            </View>

            <SectionTitle label="Reading Services" />
            {SERVICES.map((sv, i) => (
              <View key={i} style={s.serviceCard}>
                <View style={s.serviceHeadRow}>
                  <Text style={s.serviceIcon}>{sv.icon}</Text>
                  <Text style={s.serviceTitle}>{sv.title}</Text>
                </View>
                <Text style={s.serviceSub}>{sv.sub}</Text>
              </View>
            ))}

            <View style={s.modeNote}>
              <Text style={s.modeNoteText}>
                Phone or chat reading available as per your comfort.
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={[C.surfaceAlt, C.surfaceDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaCard}
          >
            <Text style={s.ctaEmoji}>🌟</Text>
            <Text style={s.ctaHeading}>Ready for guidance?</Text>
            <Text style={s.ctaSub}>Find clarity and direction in your life journey.</Text>
            <Text style={s.ctaPriceNote}>Please contact for price details.</Text>
            <GradientButton
              title="✦ Book a session"
              onPress={() => navigation.navigate("Booking")}
              style={{ marginTop: 14, alignSelf: "center" }}
            />
          </LinearGradient>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(200,154,255,0.1)",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: C.primaryLight, lineHeight: 22 },
  shareIcon: { fontSize: 14, color: C.primaryLight },
  pageTitle: { fontSize: 15, fontWeight: "600", color: C.textPrimary },
  heroBand: {
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
  },
  glowTR: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(138,82,255,0.22)",
    top: -60,
    right: -60,
  },
  glowBL: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,107,157,0.15)",
    bottom: -30,
    left: -30,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "rgba(200,154,255,0.45)",
    padding: 3,
    alignSelf: "center",
    marginBottom: 14,
    backgroundColor: "rgba(200,154,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: C.surfaceDeep,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  heroName: {
    fontFamily: "serif",
    fontSize: 26,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  heroRole: {
    fontSize: 12,
    color: C.textSec,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  loadingPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  loadingText: { fontSize: 11, color: C.textSec, fontWeight: "600" },
  errorPill: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },
  errorText: { fontSize: 11, color: C.textSec, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  badge: {
    backgroundColor: "rgba(200,154,255,0.12)",
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 9, color: C.primaryLight },
  body: { padding: 16, paddingTop: 4 },
  secTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 },
  secDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  secTitle: { fontSize: 13, fontWeight: "700", color: C.textPrimary },
  storyCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: "center",
  },
  bodyText: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 20,
    textAlign: "center",
  },
  keywordText: {
    marginTop: 10,
    fontSize: 10,
    color: C.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  approachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  approachCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  apIcon: { fontSize: 22, marginBottom: 6 },
  apTitle: { fontSize: 11, fontWeight: "600", color: C.textPrimary, marginBottom: 3 },
  apSub: { fontSize: 10, color: C.textMuted, lineHeight: 15 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "rgba(200,154,255,0.10)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 10, color: C.primaryLight, fontWeight: "500" },
  serviceCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  serviceHeadRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  serviceIcon: { fontSize: 18 },
  serviceTitle: { fontSize: 12, fontWeight: "700", color: C.textPrimary },
  serviceSub: { fontSize: 11, color: C.textSec, lineHeight: 17 },
  modeNote: {
    marginTop: 4,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  modeNoteText: { fontSize: 11, color: C.gold, fontWeight: "600", textAlign: "center" },
  ctaCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderStrong,
    padding: 20,
    alignItems: "center",
  },
  ctaEmoji: { fontSize: 32, marginBottom: 8 },
  ctaHeading: {
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 6,
  },
  ctaSub: { fontSize: 12, color: C.textSec, textAlign: "center", lineHeight: 18 },
  ctaPriceNote: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
