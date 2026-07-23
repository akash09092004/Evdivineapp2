import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveScreen from "../components/ResponsiveScreen";
import LinearGradient from "../components/LinearGradient";
import { Colors, Shadows } from "../theme/colors";
import { fetchPageContentList } from "../Services/pageContentApi";
import PageContentSection from "../components/PageContentSection";

const fallbackItems = [
  { title: "FAQ", pageKey: "faq", icon: "help-circle-outline" },
  { title: "Agreement", pageKey: "agreement", icon: "document-text-outline" },
  {
    title: "Terms and Conditions",
    pageKey: "terms-and-conditions",
    icon: "document-outline",
  },
  {
    title: "Privacy Policies",
    pageKey: "privacy-policies",
    icon: "shield-checkmark-outline",
  },
  {
    title: "Refund & Cancellation Policy",
    pageKey: "refund-cancellation-policy",
    icon: "cash-outline",
  },
  {
    title: "Satisfaction Guarantee",
    pageKey: "satisfaction-guarantee",
    icon: "star-outline",
  },
  { title: "Disclaimer", pageKey: "disclaimer", icon: "alert-circle-outline" },
  {
    title: "Cookies Policy",
    pageKey: "cookies-policy",
    icon: "layers-outline",
  },
  {
    title: "Advisor Terms and Conditions",
    pageKey: "advisor-terms-and-conditions",
    icon: "person-circle-outline",
  },
  { title: "Legal Info", pageKey: "legal-info", icon: "document-lock-outline" },
  {
    title: "Help Support",
    pageKey: "help-support",
    icon: "chatbubble-ellipses-outline",
  },
  { title: "Contact Us", pageKey: "contact-us", icon: "mail-outline" },
];

const allowedKeys = new Set(fallbackItems.map((item) => item.pageKey));

const normalizeItem = (item) => ({
  title: item?.title || "Page",
  pageKey: String(item?.pageKey || item?.page || "")
    .trim()
    .toLowerCase(),
  description: String(item?.description || "").trim(),
  icon: item?.icon || "document-text-outline",
});

export default function LegalInfo({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState(fallbackItems);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchPageContentList();
      const pageItems = Array.isArray(response?.pages) ? response.pages : [];
      const normalized = pageItems
        .map(normalizeItem)
        .filter((item) => item.pageKey && allowedKeys.has(item.pageKey));

      const merged = fallbackItems.map((fallback) => {
        const match = normalized.find(
          (item) => item.pageKey === fallback.pageKey
        );
        return {
          ...fallback,
          title: match?.title || fallback.title,
          description: match?.description || "",
        };
      });

      setItems(merged);
    } catch (fetchError) {
      setError(fetchError?.message || "Unable to load page content");
      setItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const headerSubtitle = useMemo(
    () =>
      error
        ? error
        : "Open any policy page to read the latest content from the backend.",
    [error]
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        navigation?.navigate?.("SectionDetail", {
          title: item.title,
          subtitle: item.description || "Page content",
          pageKey: item.pageKey,
          emoji: "✦",
          description: item.description || "",
        })
      }
    >
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText}>
          {item.description || "Open to view the latest policy content."}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation?.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Legal Information</Text>
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            </View>
            <View style={styles.iconBtn}>
              <Ionicons name="document-lock-outline" size={20} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name="shield-checkmark"
              size={34}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.heroTitle}>Policies & Pages</Text>
          <Text style={styles.heroText}>
            The latest page content is loaded from the backend so you always see
            the current version.
          </Text>
        </View>

        <PageContentSection
          pageKey="legal-info"
          titleFallback="Legal Info"
          subtitleFallback="Backend content for policies and pages"
          icon="document-lock-outline"
        />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading pages...</Text>
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.pageKey}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
    textAlign: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    margin: 16,
    marginBottom: 10,
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
  loadingCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...Shadows.card,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
    ...Shadows.card,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gradientSoftStart,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  cardText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
