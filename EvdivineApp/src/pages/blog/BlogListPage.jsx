import React, { useEffect, useRef, useState } from "react";
import {
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
import { Colors } from "../../theme/colors";
import BlogHero from "../../components/blog/BlogHero";
import BlogSearch from "../../components/blog/BlogSearch";
import BlogFilters from "../../components/blog/BlogFilters";
import BlogGrid from "../../components/blog/BlogGrid";
import BlogCard from "../../components/blog/BlogCard";
import BlogPagination from "../../components/blog/BlogPagination";
import BlogSkeleton from "../../components/blog/BlogSkeleton";
import BlogFooter from "../../components/blog/BlogFooter";
import { loadBlogCategories, useBlogList } from "../../hooks/useBlogs";

const DEFAULT_LIMIT = 9;
const DEFAULT_QUERY = {
  page: 1,
  limit: DEFAULT_LIMIT,
  search: "",
  category: "",
  tags: "",
  featured: false,
  trending: false,
  sort: "latest",
};

const asString = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
};

const toBool = (value) => value === true || value === "true" || value === "1" || value === 1;

const buildQueryState = (params = {}) => ({
  page: Math.max(1, Number(params.page) || 1),
  limit: Math.max(1, Number(params.limit) || DEFAULT_LIMIT),
  search: asString(params.search).trim(),
  category: asString(params.category).trim(),
  tags: asString(params.tags).trim(),
  featured: toBool(params.featured),
  trending: toBool(params.trending),
  sort: params.sort === "oldest" ? "oldest" : "latest",
});

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

export default function BlogListPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const isTablet = width >= 720;
  const isDesktop = width >= 1100;
  const [categories, setCategories] = useState([{ key: "", label: "All" }]);
  const [searchDraft, setSearchDraft] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const routeState = buildQueryState(route.params);

  const { blogs, featuredBlogs, pagination, loading, error, refetch } = useBlogList(routeState);

  useEffect(() => {
    setSearchDraft(routeState.search);
  }, [routeState.search]);

  useEffect(() => {
    let mounted = true;
    loadBlogCategories()
      .then((items) => {
        if (!mounted) return;
        const mapped = (items || []).map((item) => ({
          key: item?.slug || item?.name || "",
          label: item?.name || item?.slug || "Category",
          imageUrl:
            item?.image?.url ||
            item?.imageUrl ||
            item?.thumbnailUrl ||
            "",
        }));
        setCategories([{ key: "", label: "All" }, ...mapped]);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([{ key: "", label: "All" }]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const { setMeta, setLink } = createSeoHelpers();
    const baseUrl =
      Platform.OS === "web" && typeof window !== "undefined"
        ? `${window.location.origin}/blog`
        : "";

    setMeta("description", "Explore Evdivine blog posts on astrology, kundli, numerology, vastu, mantras and spiritual guidance.");
    setMeta("og:title", "Evdivine Blog");
    setMeta("og:description", "Explore spiritual insights, astrology guidance and premium wellness stories.");
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image");
    setLink("canonical", baseUrl);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Evdivine Blog | Ancient Wisdom";
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== routeState.search) {
        navigation.setParams({
          ...route.params,
          search: searchDraft,
          page: 1,
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [navigation, route.params, routeState.search, searchDraft]);

  const updateParams = (next = {}) => {
    navigation.setParams({
      ...route.params,
      ...next,
    });
  };

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage });
    scrollRef.current?.scrollTo?.({ y: 0, animated: true });
  };

  const clearFilters = () => {
    setSearchDraft("");
    navigation.setParams(DEFAULT_QUERY);
    scrollRef.current?.scrollTo?.({ y: 0, animated: true });
  };

  const onPressBlog = (blog) => {
    if (!blog?.slug) return;
    navigation.navigate("BlogDetail", { slug: blog.slug });
  };

  const isEmpty = !loading && !error && blogs.length === 0;

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            isMobile && styles.contentMobile,
            !isMobile && styles.contentDesktop,
            { paddingBottom: 28 + (Platform.OS === "web" ? 0 : 64) },
          ]}
          onScroll={({ nativeEvent }) => setShowScrollTop(nativeEvent.contentOffset.y > 240)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <BlogHero
            subtitle="Premium spiritual insights, practical guidance and carefully curated articles for the Evdivine community."
          />

          {featuredBlogs.length > 0 ? (
            <View style={[styles.section, isMobile && styles.sectionMobile]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Stories</Text>
                <Text style={styles.sectionSub}>Latest highlights from the blog</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                {featuredBlogs.slice(0, 3).map((blog) => (
                  <BlogCard
                    key={blog._id || blog.id || blog.slug}
                    blog={blog}
                    compact
                    onPress={() => onPressBlog(blog)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={[styles.toolbar, isMobile && styles.toolbarMobile]}>
            <BlogSearch
              value={searchDraft}
              onChange={setSearchDraft}
              onSubmit={() =>
                updateParams({
                  search: searchDraft,
                  page: 1,
                })
              }
            />

            {routeState.tags ? (
              <View style={styles.activeTagRow}>
                <Text style={styles.activeTagLabel}>Active tag filter</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => updateParams({ tags: "", page: 1 })}
                  style={({ pressed }) => [styles.activeTagChip, pressed && styles.activeTagPressed]}
                >
                  <Text style={styles.activeTagText}>
                    {routeState.tags
                      .split(",")
                      .filter(Boolean)
                      .map((tag) => `#${tag.trim()}`)
                      .join(", ")}
                  </Text>
                  <Ionicons name="close" size={14} color={Colors.primary} />
                </Pressable>
              </View>
            ) : null}

            <BlogFilters
              categories={categories}
              selectedCategory={routeState.category}
              onSelectCategory={(category) =>
                updateParams({
                  category,
                  page: 1,
                  // Category change should not keep stale highlight filters around.
                  featured: false,
                  trending: false,
                })
              }
              sort={routeState.sort}
              onSortChange={(sort) => updateParams({ sort, page: 1 })}
              featured={routeState.featured}
              trending={routeState.trending}
              onToggleFeatured={() =>
                updateParams({
                  featured: !routeState.featured,
                  page: 1,
                })
              }
              onToggleTrending={() =>
                updateParams({
                  trending: !routeState.trending,
                  page: 1,
                })
              }
            />
          </View>

          <View style={[styles.section, isMobile && styles.sectionMobile]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleCompact]}>Recent Posts</Text>
              <Text style={styles.sectionSub}>
                {pagination.totalBlogs ? `${pagination.totalBlogs} articles found` : "Curated blog library"}
              </Text>
            </View>

            {loading ? (
              <BlogSkeleton variant="grid" count={isDesktop ? 6 : isTablet ? 4 : 3} />
            ) : error ? (
              <StateCard
                icon="alert-circle-outline"
                title="We could not load the blogs"
                message={error.message || "Please try again in a moment."}
                primaryLabel="Retry"
                onPrimaryPress={refetch}
              />
            ) : isEmpty ? (
              <StateCard
                icon="document-text-outline"
                title="No blogs match your filters"
                message="Try a different category, clear the search, or reset all filters."
                primaryLabel="Clear Filters"
                onPrimaryPress={clearFilters}
              />
            ) : (
              <>
                <BlogGrid>
                  {blogs.map((blog) => (
                    <BlogCard
                      key={blog._id || blog.id || blog.slug}
                      blog={blog}
                      onPress={() => onPressBlog(blog)}
                      style={[
                        styles.gridItem,
                        isDesktop && styles.gridThird,
                        !isDesktop && isTablet && styles.gridHalf,
                        !isTablet && styles.gridFull,
                      ]}
                    />
                  ))}
                </BlogGrid>

                <BlogPagination
                  currentPage={pagination.page || routeState.page}
                  totalPages={pagination.totalPages || 1}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  onChangePage={handlePageChange}
                />
              </>
            )}
          </View>

          <BlogFooter
            onNavigate={(routeName) => {
              if (routeName === "Blog") {
                navigation.navigate("Blog", DEFAULT_QUERY);
                return;
              }

              navigation.navigate(routeName);
            }}
          />
        </ScrollView>

        {showScrollTop ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => scrollRef.current?.scrollTo?.({ y: 0, animated: true })}
            style={({ pressed }) => [styles.scrollTop, pressed && styles.scrollTopPressed]}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        ) : null}
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

function StateCard({ icon, title, message, primaryLabel, onPrimaryPress }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={28} color={Colors.primary} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPrimaryPress}
        style={({ pressed }) => [styles.stateBtn, pressed && styles.stateBtnPressed]}
      >
        <Text style={styles.stateBtnText}>{primaryLabel}</Text>
      </Pressable>
    </View>
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
    paddingBottom: 32,
  },
  contentMobile: {
    paddingBottom: 24,
  },
  contentDesktop: {
    paddingTop: 0,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 14,
  },
  sectionMobile: {
    paddingHorizontal: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  sectionTitleCompact: {
    fontSize: 21,
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  toolbar: {
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  toolbarMobile: {
    paddingHorizontal: 12,
  },
  activeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  activeTagLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  activeTagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  activeTagPressed: {
    opacity: 0.9,
  },
  activeTagText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  featuredRow: {
    gap: 14,
    paddingBottom: 4,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 300,
    maxWidth: 380,
  },
  gridThird: {
    flexBasis: "31%",
  },
  gridHalf: {
    flexBasis: "48%",
  },
  gridFull: {
    flexBasis: "100%",
    maxWidth: "100%",
  },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    gap: 10,
  },
  stateIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163,75,31,0.08)",
  },
  stateTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  stateMessage: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 520,
  },
  stateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  stateBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  stateBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  scrollTop: {
    position: "absolute",
    right: 16,
    bottom: Platform.OS === "web" ? 24 : 88,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  scrollTopPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
