import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

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

const splitList = (value) => {
  const text = normalizeText(value);
  if (!text) return [];

  return text
    .split(/\n+|,+/)
    .map((item) => item.replace(/^[•\-\u2022]+\s*/g, "").trim())
    .filter(Boolean);
};

const formatUSD = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Contact for price";
  }
  return `$${amount.toFixed(2)}`;
};

export default function OfferDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const offerId = String(route?.params?.offerId || route?.params?.id || "").trim();
  const initialOffer = route?.params?.offer || null;
  const [offer, setOffer] = useState(initialOffer);
  const [loading, setLoading] = useState(Boolean(offerId && !initialOffer));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadOffer = async () => {
      if (!offerId) {
        setLoading(false);
        return;
      }

      if (initialOffer?._id === offerId) {
        setOffer(initialOffer);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_BASE_URL}/api/content/banners/${encodeURIComponent(offerId)}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Unable to load offer");
        }
        if (mounted) {
          setOffer(payload?.data || null);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError?.message || "Unable to load offer");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOffer();

    return () => {
      mounted = false;
    };
  }, [initialOffer, offerId]);

  const title = offer?.title || route?.params?.title || "Latest Offer";
  const subtitle = offer?.subtitle || "Limited time offer";
  const shortDescription =
    offer?.shortDescription || offer?.description || "Special offer details";
  const longContent = useMemo(
    () =>
      normalizeText(
        offer?.longContent ||
          offer?.description ||
          offer?.shortDescription ||
          "Offer details will appear here."
      ),
    [offer?.description, offer?.longContent, offer?.shortDescription]
  );
  const benefits = useMemo(() => splitList(offer?.benefits), [offer?.benefits]);
  const consultationPrice = Number(offer?.consultationPrice || 0);
  const offerPrice = Number(offer?.offerPrice || 0);
  const imageUrl = offer?.imageUrl || "";
  const linkType = String(offer?.linkType || "none");
  const linkValue = String(offer?.linkValue || "").trim();

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login", {
        redirectTo: "Booking",
        redirectParams: {
          service: title,
          consultationType: "Latest Offer",
          price: offerPrice || consultationPrice,
          consultationPrice: consultationPrice || offerPrice,
          offerPrice,
          bannerId: offer?._id || offerId,
          bannerTitle: title,
        },
        successMessage: "Please login to continue booking.",
      });
      return;
    }

    navigation.navigate("Booking", {
      service: title,
      consultationType: "Latest Offer",
      price: offerPrice || consultationPrice,
      consultationPrice: consultationPrice || offerPrice,
      offerPrice,
      bannerId: offer?._id || offerId,
      bannerTitle: title,
    });
  };

  const openExternalLink = () => {
    if (!linkValue) {
      return;
    }

    if (linkType === "url") {
      Linking.openURL(linkValue).catch(() => Alert.alert("Error", "Link open nahi ho raha"));
      return;
    }

    navigation.navigate(linkValue);
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
            <View style={styles.priceStack}>
              <Text style={styles.offerPrice}>{formatUSD(offerPrice || consultationPrice)}</Text>
              {Number(consultationPrice) > Number(offerPrice) ? (
                <Text style={styles.originalPrice}>{formatUSD(consultationPrice)}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.badgeRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{subtitle}</Text>
              </View>
              <View style={[styles.pill, styles.pricePill]}>
                <Text style={styles.pricePillText}>{offer?.isActive === false ? "Inactive" : "Active"}</Text>
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{shortDescription}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About Offer</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#A34B1F" />
              <Text style={styles.body}>Loading offer details...</Text>
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
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Text style={styles.priceText}>{formatUSD(offerPrice || consultationPrice)}</Text>
          <Text style={styles.priceNote}>Original: {formatUSD(consultationPrice)}</Text>
        </View>

        {error ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Error</Text>
            <Text style={styles.body}>{error}</Text>
          </View>
        ) : null}

        {linkValue ? (
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={openExternalLink}>
            <Ionicons name="open-outline" size={20} color="#A34B1F" />
            <Text style={styles.secondaryBtnText}>Open Link</Text>
          </TouchableOpacity>
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
    borderColor: "rgba(163,75,31,0.10)",
  },
  heroImageWrap: {
    height: 280,
    position: "relative",
    backgroundColor: "#FAF0E0",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,4,26,0.14)",
  },
  priceStack: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(255,247,233,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  offerPrice: {
    color: "#A34B1F",
    fontSize: 22,
    fontWeight: "900",
  },
  originalPrice: {
    color: "#8E6D56",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  heroMeta: {
    padding: 18,
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
  },
  pillText: {
    color: "#A34B1F",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pricePill: {
    backgroundColor: "rgba(124,58,237,0.10)",
  },
  pricePillText: {
    color: "#7C3AED",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4E2513",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7F5E4A",
  },
  card: {
    backgroundColor: "#FFF7E9",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4E2513",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6A4B39",
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
    alignItems: "flex-start",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#6A4B39",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#A34B1F",
  },
  priceNote: {
    marginTop: 4,
    fontSize: 13,
    color: "#7F5E4A",
  },
  secondaryBtn: {
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.18)",
    borderRadius: 18,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: "#A34B1F",
    fontSize: 15,
    fontWeight: "800",
  },
  bookBtn: {
    backgroundColor: "#A34B1F",
    borderRadius: 18,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  bookText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
});
