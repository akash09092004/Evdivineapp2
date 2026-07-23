import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveScreen from "../../components/ResponsiveScreen";
import LinearGradient from "../../components/LinearGradient";
import { Colors, Shadows } from "../../theme/colors";
import { fetchPageContentByKey } from "../../Services/pageContentApi";

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

export default function ProfileInfoPage({
  navigation,
  title,
  subtitle,
  icon = "document-text-outline",
  sections = [],
  pageKey = "",
  footerTitle = "",
  footerText = "",
}) {
  const [openId, setOpenId] = useState(sections[0]?.id || null);
  const [remotePage, setRemotePage] = useState(null);
  const [loading, setLoading] = useState(Boolean(pageKey));
  const [error, setError] = useState("");

  useEffect(() => {
    setOpenId(sections[0]?.id || null);
  }, [sections]);

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

  const heroTitle = remotePage?.title || title;
  const heroSubtitle =
    remotePage?.description || subtitle || "EvDivine information page";
  const remoteBody = useMemo(
    () => normalizeContentText(remotePage?.content || ""),
    [remotePage?.content]
  );
  const hasRemoteContent =
    Boolean(remotePage) && Boolean(remoteBody || remotePage?.description);
  const shouldShowFallbackSections = !pageKey || !hasRemoteContent;

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{heroTitle}</Text>
              <Text style={styles.headerSubtitle}>{heroSubtitle}</Text>
            </View>
            <View style={styles.iconBtn}>
              <Ionicons name={icon} size={20} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name={icon} size={34} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{heroTitle}</Text>
            <Text style={styles.heroText}>{heroSubtitle}</Text>
            {pageKey ? (
              <Text style={styles.heroMeta}>{pageKey}</Text>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading content...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {hasRemoteContent ? (
            <View style={styles.articleCard}>
              <Text style={styles.articleTitle}>{heroTitle}</Text>
              {remotePage?.keywords ? (
                <Text style={styles.keywordText}>
                  Keywords: {remotePage.keywords}
                </Text>
              ) : null}
              <Text style={styles.articleText}>
                {remoteBody || "No content available right now."}
              </Text>
            </View>
          ) : null}

          {shouldShowFallbackSections
            ? sections.map((section) => {
            const isOpen = openId === section.id;

            return (
              <TouchableOpacity
                key={section.id}
                activeOpacity={0.86}
                onPress={() => setOpenId(isOpen ? null : section.id)}
                style={[styles.sectionCard, isOpen && styles.sectionCardActive]}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLeft}>
                    <View style={[styles.sectionIconWrap, isOpen && styles.sectionIconWrapActive]}>
                      <Ionicons
                        name={section.icon || "sparkles-outline"}
                        size={20}
                        color={isOpen ? "#fff" : Colors.primary}
                      />
                    </View>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </View>

                {isOpen ? <Text style={styles.sectionText}>{section.content}</Text> : null}
              </TouchableOpacity>
            );
          })
            : null}

          {footerText ? (
            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>
                {footerTitle || heroTitle}
              </Text>
              <Text style={styles.footerText}>{footerText}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  heroIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gradientSoftStart,
    marginBottom: 12,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  heroText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  heroMeta: {
    color: Colors.primary,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  errorText: {
    flex: 1,
    color: "#9A3412",
    fontSize: 13,
    lineHeight: 20,
  },
  articleCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  articleTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  keywordText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  articleText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  sectionCardActive: {
    borderColor: "rgba(163,75,31,0.24)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gradientSoftStart,
  },
  sectionIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    paddingLeft: 48,
  },
  footerCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  footerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
