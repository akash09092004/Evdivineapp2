import React, { useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../../theme/colors";
import BlogAuthor from "./BlogAuthor";
import { formatBlogDate } from "../../utils/formatBlogDate";
import { API_BASE_URL } from "../../config/api";

const normalizeImage = (image) => {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    const url = image.trim();
    const resolved =
      /^https?:\/\//i.test(url) || /^data:image\//i.test(url)
        ? url
        : url.startsWith("/")
          ? `${API_BASE_URL}${url}`
          : `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;

    return { url: resolved, altText: "" };
  }

  const rawUrl =
    image.url ||
    image.imageUrl ||
    image.src ||
    image.secure_url ||
    image.thumbnailUrl ||
    image.publicUrl ||
    "";

  const url =
    /^https?:\/\//i.test(rawUrl) || /^data:image\//i.test(rawUrl)
      ? rawUrl
      : rawUrl.startsWith("/")
        ? `${API_BASE_URL}${rawUrl}`
        : rawUrl
          ? `${API_BASE_URL}/${String(rawUrl).replace(/^\/+/, "")}`
          : "";

  return {
    ...image,
    url,
  };
};

const normalizeCategoryImage = (category) => {
  if (!category) {
    return null;
  }

  const normalized = normalizeImage(category?.image || category?.imageUrl || category?.thumbnailUrl);
  return normalized?.url ? normalized : null;
};

export default function BlogCard({
  blog,
  onPress,
  compact = false,
  style,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const featuredImage = normalizeImage(blog?.featuredImage || blog?.featuredImageUrl || blog?.imageUrl);
  const categoryImage = normalizeCategoryImage(blog?.category);
  const [hasImageError, setHasImageError] = useState(false);
  const metaDate = useMemo(() => formatBlogDate(blog?.publishedAt || blog?.createdAt), [
    blog?.publishedAt,
    blog?.createdAt,
  ]);

  const ImageComponent = featuredImage?.url && !hasImageError ? (
    <Image
      source={{ uri: featuredImage.url }}
      style={[styles.image, compact && styles.imageCompact]}
      resizeMode="cover"
      {...(Platform.OS === "web" ? { loading: "lazy" } : {})}
      onError={() => setHasImageError(true)}
    />
  ) : (
    <View style={[styles.imageFallback, compact && styles.imageCompact]}>
      <Ionicons name="sparkles" size={compact ? 22 : 32} color={Colors.primaryLight} />
      <Text style={styles.fallbackTitle}>Evdivine Blog</Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        !compact && isMobile && styles.cardMobile,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.mediaWrap}>
        {ImageComponent}
        <View style={styles.categoryPill}>
          {categoryImage ? (
            <Image
              source={{ uri: categoryImage.url }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : null}
          <Text style={styles.categoryText}>
            {blog?.category?.name || blog?.category || "Blog"}
          </Text>
        </View>
      </View>

      <View style={[styles.content, compact && styles.contentCompact]}>
        <BlogAuthor author={blog?.author} compact={compact} />

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{metaDate || "Recently published"}</Text>
          {blog?.readingTime ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{blog.readingTime} min read</Text>
            </>
          ) : null}
        </View>

        <Text numberOfLines={compact ? 2 : 2} style={[styles.title, compact && styles.titleCompact]}>
          {blog?.title || "Untitled Blog"}
        </Text>

        <Text numberOfLines={compact ? 3 : 4} style={[styles.excerpt, compact && styles.excerptCompact]}>
          {blog?.excerpt || "Explore spiritual insights, practical guidance and daily wisdom."}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.readMore}>Read More</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    ...Shadows.card,
    width: "100%",
  },
  cardCompact: {
    width: 280,
  },
  cardMobile: {
    borderRadius: 20,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  mediaWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 1.6,
    backgroundColor: Colors.surfaceSoft,
  },
  imageCompact: {
    aspectRatio: 1.45,
  },
  imageFallback: {
    width: "100%",
    aspectRatio: 1.6,
    backgroundColor: Colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fallbackTitle: {
    color: Colors.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  categoryPill: {
    position: "absolute",
    left: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.92)",
  },
  categoryImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  categoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  contentCompact: {
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(78,37,19,0.28)",
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  excerpt: {
    color: "rgba(78,37,19,0.76)",
    fontSize: 14,
    lineHeight: 21,
  },
  excerptCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readMore: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
