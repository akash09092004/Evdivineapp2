import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchPageContentByKey } from "../Services/pageContentApi";
import { Colors, Shadows } from "../theme/colors";

const normalizeContentText = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<\/?li[^>]*>/gi, "\n- ")
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<\/?ol[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default function PageContentSection({
  pageKey,
  titleFallback,
  subtitleFallback,
  icon = "document-text-outline",
  hideHeader = false,
  centerBody = false,
  hideKeywords = false,
}) {
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

  const pageTitle =
    remotePage?.title ||
    titleFallback ||
    String(pageKey || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const pageSubtitle =
    remotePage?.description ||
    subtitleFallback ||
    "Latest content from backend";
  const pageBody = useMemo(
    () => normalizeContentText(remotePage?.content || ""),
    [remotePage?.content]
  );
  const keywords = remotePage?.keywords || "";

  return (
    <View style={styles.card}>
      {hideHeader ? null : (
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{pageTitle}</Text>
            <Text style={styles.subtitle}>{pageSubtitle}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={[styles.stateRow, centerBody && styles.stateRowCenter]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading content...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={[styles.body, centerBody && styles.bodyCenter]}>
        {pageBody || "No backend content available yet."}
      </Text>

      {keywords && !hideKeywords ? (
        <Text style={styles.keywords}>Keywords: {keywords}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gradientSoftStart,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: "#B45309",
    fontSize: 12,
    marginTop: 10,
  },
  body: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  bodyCenter: {
    textAlign: "center",
  },
  stateRowCenter: {
    justifyContent: "center",
  },
  keywords: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
