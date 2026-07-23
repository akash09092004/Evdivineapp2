import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { fetchRashiBySlug } from "../Services/rashiApi";

const normalizeText = (value) =>
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

const splitBenefits = (value) => {
  const text = normalizeText(value);
  if (!text) return [];

  return text
    .split(/\n+/)
    .map((item) => item.replace(/^[•\-\u2022]+\s*/g, "").trim())
    .filter(Boolean);
};

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return "Contact for price";
  }

  return `₹${number.toLocaleString("en-IN")}`;
};

export default function RashiDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const slug = String(
    route?.params?.slug || route?.params?.rashiSlug || route?.params?.rashi || ""
  ).trim();
  const fallbackRashi = route?.params?.initialRashi || {};
  const [rashi, setRashi] = useState(fallbackRashi || null);
  const [loading, setLoading] = useState(Boolean(slug && !fallbackRashi?._id));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetchRashiBySlug(slug);
        if (!mounted) return;
        setRashi(response || fallbackRashi || null);
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError?.message || "Unable to load rashi details");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (fallbackRashi?._id && fallbackRashi?.slug === slug) {
      setRashi(fallbackRashi);
      setLoading(false);
      setError("");
    } else {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [fallbackRashi, slug]);

  const title = rashi?.name || route?.params?.rashiName || "Rashi Detail";
  const element = rashi?.element || "";
  const shortDescription =
    rashi?.shortDescription || rashi?.description || "Detailed rashi information";
  const longContent = useMemo(
    () =>
      normalizeText(
        rashi?.longContent ||
          rashi?.content ||
          rashi?.description ||
          "Detailed rashi guidance will appear here."
      ),
    [rashi?.content, rashi?.description, rashi?.longContent]
  );
  const benefits = useMemo(() => splitBenefits(rashi?.benefits), [rashi?.benefits]);
  const consultationPrice = Number(rashi?.consultationPrice || route?.params?.price || 0);
  const imageUrl = rashi?.imageUrl || route?.params?.imageUrl || "";

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigation?.navigate?.("Login", {
        redirectTo: "Booking",
        redirectParams: {
          service: title,
          consultationType: "Rashi",
          rashiSlug: slug,
          rashiName: title,
          price: consultationPrice,
        },
        successMessage: "Please login to continue booking.",
      });
      return;
    }

    navigation.navigate("Booking", {
      service: title,
      consultationType: "Rashi",
      rashiSlug: slug,
      rashiName: title,
      price: consultationPrice,
    });
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#2E160B" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroImageWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="sparkles-outline" size={42} color="#A34B1F" />
              </View>
            )}
            <View style={styles.heroOverlay} />
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.badgeRow}>
              {element ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{element}</Text>
                </View>
              ) : null}
              <View style={[styles.pill, styles.pricePill]}>
                <Text style={styles.pricePillText}>{formatPrice(consultationPrice)}</Text>
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{shortDescription}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About Rashi</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#A34B1F" />
              <Text style={styles.body}>Loading rashi details...</Text>
            </View>
          ) : (
            <Text style={styles.body}>{longContent}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitsWrap}>
            {(benefits.length ? benefits : [shortDescription]).map((item, index) => (
              <View key={`${item}-${index}`} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#A34B1F" />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consultation Price</Text>
          <Text style={styles.priceText}>{formatPrice(consultationPrice)}</Text>
          <Text style={styles.priceNote}>
            Price can be managed from admin panel and will reflect here automatically.
          </Text>
        </View>

        {error ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Error</Text>
            <Text style={styles.body}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85} onPress={handleBookNow}>
          <Ionicons name="calendar-outline" size={20} color="#fff" />
          <Text style={styles.bookText}>Book Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8E8C7",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#A34B1F",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 14,
  },
  backText: {
    color: "#fff",
    fontWeight: "800",
  },
  hero: {
    backgroundColor: "#FFF7E9",
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
  },
  heroImageWrap: {
    height: 320,
    position: "relative",
    backgroundColor: "#EDE2D0",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    transform: [{ translateY: 14 }],
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(46,22,11,0.10)",
  },
  heroMeta: {
    padding: 18,
    marginTop: -28,
    backgroundColor: "rgba(255,247,233,0.98)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.10)",
  },
  pricePill: {
    backgroundColor: "#8B2BE2",
  },
  pillText: {
    color: "#A34B1F",
    fontWeight: "800",
    fontSize: 12,
  },
  pricePillText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#2E160B",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#5C4331",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2E160B",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4E2513",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitsWrap: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#4E2513",
  },
  priceText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#8B2BE2",
  },
  priceNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#6E4A36",
  },
  bookBtn: {
    backgroundColor: "#8B2BE2",
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  bookText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});
