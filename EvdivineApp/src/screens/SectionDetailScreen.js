import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import ResponsiveScreen from "../components/ResponsiveScreen";
import LinearGradient from "../components/LinearGradient";
import { Colors, Shadows } from "../theme/colors";
import { fetchPageContentByKey } from "../Services/pageContentApi";

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

export default function SectionDetailScreen({ navigation, route }) {
  const {
    title = "Details",
    subtitle = "Information",
    emoji = "✦",
    description = "This section is now connected through AppNavigator.",
    pageKey = "",
  } = route?.params || {};
  const [remotePage, setRemotePage] = useState(null);
  const [loading, setLoading] = useState(Boolean(pageKey));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!pageKey) {
        setRemotePage(null);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetchPageContentByKey({ pageKey });
        if (!mounted) return;
        setRemotePage(response?.pageContent || null);
      } catch (fetchError) {
        if (!mounted) return;
        setRemotePage(null);
        setError(fetchError?.message || "Unable to load page content");
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
  }, [pageKey]);

  const pageTitle = remotePage?.title || title;
  const pageSubtitle = remotePage?.description || subtitle;
  const pageBody = useMemo(
    () =>
      normalizeContentText(
        remotePage?.content || description || "This section is now connected through AppNavigator."
      ),
    [description, remotePage?.content]
  );

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.hero}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.title}>{pageTitle}</Text>
            <Text style={styles.subtitle}>{pageSubtitle}</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.body}>Loading page content...</Text>
              </View>
            ) : (
              <Text style={styles.body}>{pageBody}</Text>
            )}
          </View>

          {error ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Error</Text>
              <Text style={styles.body}>{error}</Text>
            </View>
          ) : null}

          {remotePage?.keywords ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Keywords</Text>
              <Text style={styles.body}>{remotePage.keywords}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Booking", { service: pageTitle })}
          >
            <Text style={styles.ctaText}>Book Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 28 },
  backBtn: { alignSelf: "flex-start", marginBottom: 14 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
  hero: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    ...Shadows.lg,
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.88)", marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    ...Shadows.card,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: Colors.text, marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 20, color: Colors.textMuted },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cta: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadows.card,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
