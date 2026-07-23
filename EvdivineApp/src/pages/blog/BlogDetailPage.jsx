import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ResponsiveScreen from "../../components/ResponsiveScreen";
import { Colors, Shadows } from "../../theme/colors";
import { useBlogDetail } from "../../hooks/useBlogs";
import BlogSkeleton from "../../components/blog/BlogSkeleton";
import BlogAuthor from "../../components/blog/BlogAuthor";
import BlogContent from "../../components/blog/BlogContent";
import BlogShareButtons from "../../components/blog/BlogShareButtons";
import RelatedBlogs from "../../components/blog/RelatedBlogs";
import BlogFooter from "../../components/blog/BlogFooter";
import { formatBlogDate } from "../../utils/formatBlogDate";
import { API_BASE_URL } from "../../config/api";

const createSeoHelpers = () => {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return {
      setMeta: () => {},
      setLink: () => {},
    };
  }

  const ensureMeta = (name, keyOrContent, maybeContent) => {
    const key =
      maybeContent === undefined
        ? String(name).startsWith("twitter:")
          ? "name"
          : String(name).includes(":")
            ? "property"
            : "name"
        : keyOrContent;
    const content = maybeContent === undefined ? keyOrContent : maybeContent;

    if (!content) return;
    let tag = document.head.querySelector(`meta[${key}="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(key, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };

  const ensureLink = (rel, href) => {
    if (!href) return;
    let tag = document.head.querySelector(`link[rel="${rel}"]`);
    if (!tag) {
      tag = document.createElement("link");
      tag.setAttribute("rel", rel);
      document.head.appendChild(tag);
    }
    tag.setAttribute("href", href);
  };

  return {
    setMeta: ensureMeta,
    setLink: ensureLink,
  };
};

const DEFAULT_BLOG_QUERY = {
  page: 1,
  limit: 9,
  search: "",
  category: "",
  tags: "",
  featured: false,
  trending: false,
  sort: "latest",
};

const normalizeCategoryImage = (category) => {
  const raw =
    category?.image?.url ||
    category?.imageUrl ||
    category?.thumbnailUrl ||
    category?.thumb ||
    "";

  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
    return raw;
  }

  return raw.startsWith("/")
    ? `${API_BASE_URL}${raw}`
    : `/${raw.replace(/^\/+/, "")}`;
};

export default function BlogDetailPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isMobile = width < 620;
  const { slug } = route.params || {};
  const { blog, relatedBlogs, previousBlog, nextBlog, loading, error, notFound, refetch } =
    useBlogDetail(slug);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    setCurrentUrl(window.location.href);
  }, [slug]);

  useEffect(() => {
    if (!blog) {
      return;
    }

    const { setMeta, setLink } = createSeoHelpers();
    const title = `${blog?.seo?.metaTitle || blog?.title || "Blog"} | Evdivine`;
    const description = blog?.seo?.metaDescription || blog?.excerpt || "Evdivine blog article.";
    const image =
      blog?.seo?.ogImage ||
      blog?.featuredImage?.url ||
      blog?.featuredImage?.imageUrl ||
      blog?.featuredImage?.src ||
      blog?.featuredImage?.secure_url ||
      blog?.featuredImage?.thumbnailUrl ||
      blog?.featuredImageUrl ||
      blog?.imageUrl ||
      blog?.featuredImage;
    const canonical = Platform.OS === "web" && typeof window !== "undefined" ? window.location.href : "";

    setMeta("description", "name", description);
    setMeta("og:title", "property", title);
    setMeta("og:description", "property", description);
    setMeta("og:type", "property", "article");
    setMeta("og:image", "property", image);
    setMeta("og:url", "property", canonical);
    setMeta("twitter:card", "name", "summary_large_image");
    setMeta("article:published_time", "property", blog?.publishedAt || blog?.createdAt || "");
    setLink("canonical", canonical);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = title;
    }
  }, [blog]);

  const shareUrl = useMemo(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return window.location.href;
    }

    return currentUrl || (blog?.slug ? `https://evdivine.com/blog/${blog.slug}` : "");
  }, [blog?.slug, currentUrl]);

  const handleNavigateTag = (tag) => {
    goToTab("Blog", {
      page: 1,
      search: "",
      category: "",
      tags: tag,
      featured: false,
      trending: false,
      sort: "latest",
    });
  };

  const onNavigateBlog = (item) => {
    if (!item?.slug) return;
    navigation.push("BlogDetail", { slug: item.slug });
  };

  const goToTab = (screen, params) => {
    navigation.navigate("MainTabs", {
      screen,
      params: params || undefined,
    });
  };

  const appStoreUrl = Platform.OS === "ios"
    ? "https://apps.apple.com/search?term=Evdivine"
    : "https://play.google.com/store/search?q=Evdivine&c=apps";

  if (loading) {
    return (
      <ResponsiveScreen backgroundColor={Colors.bg}>
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
          <ScrollView contentContainerStyle={styles.loadingWrap}>
            <BlogSkeleton variant="detail" />
          </ScrollView>
        </SafeAreaView>
      </ResponsiveScreen>
    );
  }

  if (error || notFound || !blog) {
    return (
      <ResponsiveScreen backgroundColor={Colors.bg}>
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
          <ScrollView contentContainerStyle={styles.stateWrap}>
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons name={notFound ? "document-text-outline" : "alert-circle-outline"} size={28} color={Colors.primary} />
              </View>
              <Text style={styles.stateTitle}>{notFound ? "Blog not found" : "Could not load blog"}</Text>
              <Text style={styles.stateText}>
                {notFound
                  ? "This article may have been moved, archived, or removed."
                  : error?.message || "Please retry or go back to the blog list."}
              </Text>
              <View style={[styles.stateActions, isMobile && styles.stateActionsCompact]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                    return;
                  }

                    goToTab("Blog", DEFAULT_BLOG_QUERY);
                  }}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.primaryBtnText}>Back to Blogs</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={refetch}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.secondaryBtnText}>Retry</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ResponsiveScreen>
    );
  }

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.breadcrumbRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                goToTab("Blog");
              }}
              style={({ pressed }) => [styles.crumbBtn, pressed && styles.crumbPressed]}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primary} />
              <Text style={[styles.crumbText, isMobile && styles.crumbTextCompact]}>Back to Blogs</Text>
            </Pressable>

            <Text style={[styles.breadcrumb, isMobile && styles.breadcrumbCompact]}>
              Home / Blog / {blog?.title || "Article"}
            </Text>
          </View>

          <View style={[styles.heroCard, isMobile && styles.heroCardCompact]}>
            <BlogMedia
              key={blog?.slug || blog?._id || "blog-media"}
              blog={blog}
              compact={isMobile}
            />

            <View style={[styles.metaColumn, isMobile && styles.metaColumnCompact]}>
              <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                  {normalizeCategoryImage(blog?.category) ? (
                    <Image
                      source={{ uri: normalizeCategoryImage(blog?.category) }}
                      style={styles.categoryBadgeImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={styles.badge}>{blog?.category?.name || blog?.category || "Blog"}</Text>
                </View>
                {blog?.isFeatured ? <Text style={styles.secondaryBadge}>Featured</Text> : null}
                {blog?.isTrending ? <Text style={styles.secondaryBadge}>Trending</Text> : null}
              </View>

              <Text style={[styles.title, isMobile && styles.titleCompact]}>{blog?.title}</Text>

              <View style={[styles.authorRow, isMobile && styles.authorRowCompact]}>
                <BlogAuthor author={blog?.author} showMeta />
                <View style={styles.infoPill}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                  <Text style={styles.infoText}>{formatBlogDate(blog?.publishedAt || blog?.createdAt)}</Text>
                </View>
                {blog?.readingTime ? (
                  <View style={styles.infoPill}>
                    <Ionicons name="time-outline" size={14} color={Colors.primary} />
                    <Text style={styles.infoText}>{blog.readingTime} min read</Text>
                  </View>
                ) : null}
                <View style={styles.infoPill}>
                  <Ionicons name="eye-outline" size={14} color={Colors.primary} />
                  <Text style={styles.infoText}>{blog?.views || 0} views</Text>
                </View>
              </View>

              {blog?.excerpt ? <Text style={styles.excerpt}>{blog.excerpt}</Text> : null}

              <BlogShareButtons url={shareUrl} />
            </View>
          </View>

          <View style={[styles.contentCard, isMobile && styles.contentCardCompact]}>
            <Text style={styles.sectionTitle}>Article</Text>
            <BlogContent html={blog?.content || ""} />
          </View>

          {blog?.tags?.length ? (
            <View style={[styles.tagsCard, isMobile && styles.tagsCardCompact]}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagRow}>
                {blog.tags.map((tag) => (
                  <Pressable
                    key={tag}
                    accessibilityRole="button"
                    onPress={() => handleNavigateTag(tag)}
                    style={({ pressed }) => [styles.tagPill, pressed && styles.tagPressed]}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <RelatedBlogs blogs={relatedBlogs} onPressBlog={onNavigateBlog} />

          <View style={styles.nextPrevRow}>
            <SideArticle
              label="Previous Blog"
              item={previousBlog}
              onPress={() => previousBlog && onNavigateBlog(previousBlog)}
              direction="left"
              compact={isMobile}
            />
            <SideArticle
              label="Next Blog"
              item={nextBlog}
              onPress={() => nextBlog && onNavigateBlog(nextBlog)}
              direction="right"
              compact={isMobile}
            />
          </View>

          <View style={[styles.ctaCard, isMobile && styles.ctaCardCompact]}>
            <Text style={styles.ctaTitle}>Need personal guidance?</Text>
            <Text style={styles.ctaText}>
              Book a consultation or connect with an expert for tailored spiritual support.
            </Text>

            <View style={[styles.ctaRow, isMobile && styles.ctaRowCompact]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => goToTab("Chat")}
                style={({ pressed }) => [styles.ctaPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.ctaPrimaryText}>Talk to Expert</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => goToTab("Booking")}
                style={({ pressed }) => [styles.ctaSecondary, pressed && styles.btnPressed]}
              >
                <Text style={styles.ctaSecondaryText}>Book Consultation</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(appStoreUrl).catch(() => Alert.alert("Info", "App link not available yet."))}
                style={({ pressed }) => [styles.ctaTertiary, pressed && styles.btnPressed]}
              >
                <Text style={styles.ctaTertiaryText}>Download Evdivine App</Text>
              </Pressable>
            </View>
          </View>

          <BlogFooter
            onNavigate={(routeName) => {
              if (routeName === "Blog") {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                goToTab("Blog", DEFAULT_BLOG_QUERY);
                return;
              }

              if (["Home", "About", "Services", "Booking", "Chat", "Profile"].includes(routeName)) {
                goToTab(routeName);
                return;
              }

              navigation.navigate(routeName);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

function BlogMedia({ blog, compact = false }) {
  const [imageError, setImageError] = useState(false);
  const image =
    blog?.featuredImage?.url ||
    blog?.featuredImage?.imageUrl ||
    blog?.featuredImage?.src ||
    blog?.featuredImage?.secure_url ||
    blog?.featuredImage?.thumbnailUrl ||
    blog?.featuredImage ||
    blog?.featuredImageUrl ||
    blog?.imageUrl;

  if (!image || imageError) {
    return (
      <View style={[styles.imageFallback, compact && styles.imageFallbackCompact]}>
        <Ionicons name="sparkles" size={32} color={Colors.primaryLight} />
        <Text style={styles.fallbackText}>Evdivine Blog</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageWrap}>
      <Image
        source={{ uri: image }}
        style={[styles.image, compact && styles.imageCompact]}
        resizeMode="cover"
        {...(Platform.OS === "web" ? { loading: "lazy" } : {})}
        onError={() => setImageError(true)}
      />
      <View style={styles.imageOverlay} />
    </View>
  );
}

function SideArticle({ label, item, onPress, direction, compact = false }) {
  if (!item) {
    return <View style={[styles.sideCard, compact && styles.sideCardCompact, styles.sideCardEmpty]} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.sideCard,
        compact && styles.sideCardCompact,
        pressed && styles.sidePressed,
      ]}
    >
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={styles.sideTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.sideFooter}>
        <Text style={styles.sideMeta}>{formatBlogDate(item.publishedAt || item.createdAt)}</Text>
        <Ionicons
          name={direction === "left" ? "arrow-back" : "arrow-forward"}
          size={18}
          color={Colors.primary}
        />
      </View>
      <Text style={styles.sideExcerpt} numberOfLines={3}>
        {item.excerpt || "Continue reading this related story for more insights."}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 18,
  },
  breadcrumbRow: {
    marginTop: 16,
    gap: 10,
  },
  crumbBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  crumbPressed: {
    opacity: 0.9,
  },
  crumbText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  crumbTextCompact: {
    fontSize: 12,
  },
  breadcrumb: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  breadcrumbCompact: {
    lineHeight: 18,
  },
  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    ...Shadows.lg,
  },
  heroCardCompact: {
    borderRadius: 22,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 1.8,
  },
  imageCompact: {
    aspectRatio: 1.25,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  imageFallback: {
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceSoft,
    gap: 8,
  },
  imageFallbackCompact: {
    height: 200,
  },
  fallbackText: {
    color: Colors.textMuted,
    fontWeight: "700",
  },
  metaColumn: {
    padding: 20,
    gap: 14,
  },
  metaColumnCompact: {
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  categoryBadgeImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badge: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  secondaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    color: Colors.primary,
    backgroundColor: "rgba(163,75,31,0.08)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    fontFamily: "serif",
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  authorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  authorRowCompact: {
    gap: 8,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
  },
  infoText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  excerpt: {
    color: "rgba(78,37,19,0.84)",
    fontSize: 15,
    lineHeight: 24,
  },
  contentCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    gap: 16,
  },
  contentCardCompact: {
    padding: 16,
    borderRadius: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  tagsCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    gap: 14,
  },
  tagsCardCompact: {
    padding: 16,
    borderRadius: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  tagPressed: {
    opacity: 0.9,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  nextPrevRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  sideCard: {
    flexGrow: 1,
    flexBasis: 300,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    gap: 8,
  },
  sideCardCompact: {
    flexBasis: "100%",
  },
  sideCardEmpty: {
    minHeight: 160,
    opacity: 0.5,
  },
  sidePressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  sideLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sideTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  sideFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  sideExcerpt: {
    color: "rgba(78,37,19,0.78)",
    fontSize: 13,
    lineHeight: 20,
  },
  ctaCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    gap: 10,
    ...Shadows.lg,
  },
  ctaCardCompact: {
    padding: 16,
    borderRadius: 20,
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  ctaText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 22,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  ctaRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  ctaPrimary: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaPrimaryText: {
    color: Colors.primary,
    fontWeight: "900",
  },
  ctaSecondary: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
  },
  ctaSecondaryText: {
    color: "#fff",
    fontWeight: "900",
  },
  ctaTertiary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
  },
  ctaTertiaryText: {
    color: "#fff",
    fontWeight: "900",
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  loadingWrap: {
    padding: 16,
    paddingBottom: 32,
  },
  stateWrap: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  stateCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    alignItems: "center",
    gap: 10,
  },
  stateIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(163,75,31,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 560,
  },
  stateActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    justifyContent: "center",
  },
  stateActionsCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtn: {
    backgroundColor: "rgba(163,75,31,0.08)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontWeight: "900",
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
