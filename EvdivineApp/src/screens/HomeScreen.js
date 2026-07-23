import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import OfficeLocationSection from "../components/contact/OfficeLocationSection";
import PageContentSection from "../components/PageContentSection";

const C = {
  bg: "#F8E8C7",
  card: "#FFF7E9",
  card2: "#F4DCB0",
  gold: "#A34B1F",
  pink: "#C06A3B",
  purple: "#8B4A27",
  text: "#4E2513",
  sub: "#8B5F49",
};

const IMAGES = {
  hero: require("../../assets/images/imagesir.png"),
  hero1: require("../../assets/images/imagesir1.png"),
  hero2: require("../../assets/images/imagesir2.png"),
  hero3: require("../../assets/images/imagesir3.png"),
  hero4: require("../../assets/images/imagesir4.png"),
  tarot: require("../../assets/images/tarot-reading.png"),
  astrology: require("../../assets/images/astrology-home.png"),
  palm: require("../../assets/images/palm reading.png"),
  vastu: require("../../assets/images/vastu.png"),
  numerology:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
  aura: require("../../assets/images/aura reading.png"),
};

const services = [
  {
    icon: "ðŸ",
    title: "Tarot Reading",
    text: "Future insights with tarot cards",
    route: "TarotReading",
    img: IMAGES.tarot,
  },
  {
    icon: "â™ˆ",
    title: "Astrology",
    text: "Know your stars and planets",
    route: "AstrologyConsultation",
    img: IMAGES.astrology,
  },
  {
    icon: "âœ‹",
    title: "Palm Reading",
    text: "Discover your life path",
    route: "PalmReading",
    img: IMAGES.palm,
  },
  {
    icon: "ðŸ ",
    title: "Vastu",
    text: "Positive energy for home",
    route: "VastuConsultation",
    img: IMAGES.vastu,
  },
  {
    icon: "",
    title: "Numerology",
    text: "Numbers guide your destiny",
    route: "Numerology",
    img: IMAGES.numerology,
  },
  {
    icon: "âœ¨",
    title: "Aura Reading",
    text: "Understand your energy",
    route: "AuraReading",
    img: IMAGES.aura,
  },
];

const menuItems = [
  { label: "Home", icon: "home-outline", route: "Home" },
  { label: "About", icon: "information-circle-outline", route: "About" },
  { label: "Services", icon: "grid-outline", route: "Services" },
  { label: "Booking", icon: "calendar-outline", route: "Booking" },
  { label: "Blog", icon: "reader-outline", route: "Blog" },
  { label: "Profile", icon: "person-outline", route: "Profile" },
];

const quickLinks = [
  { label: "Home", route: "Home" },
  { label: "About Me", route: "About" },
  { label: "Our Services", route: "Services" },
  { label: "Booking", route: "Booking" },
  { label: "Blog", route: "Blog" },
];

const serviceLinks = [
  { label: "Tarot Reading", route: "TarotReading" },
  { label: "Astrology", route: "AstrologyConsultation" },
  { label: "Palm Reading", route: "PalmReading" },
  { label: "Numerology", route: "Numerology" },
  { label: "Vastu Consultation", route: "VastuConsultation" },
];

const DEFAULT_BLOG_PARAMS = {
  page: 1,
  limit: 9,
  search: "",
  category: "",
  tags: "",
  featured: false,
  trending: false,
  sort: "latest",
};

const HERO_SLIDES = [
  { key: "hero-1", source: IMAGES.hero1, position: "center top" },
  { key: "hero-2", source: IMAGES.hero2, position: "center center" },
  { key: "hero-3", source: IMAGES.hero3, position: "center top" },
  { key: "hero-4", source: IMAGES.hero4, position: "center center" },
];

function HeroSlider({ width, isWeb, isSmallPhone, navigation }) {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidth = isWeb ? Math.min(width - 32, 1050) : width - 24;
  const heroHeight = isWeb ? 470 : width < 360 ? 280 : width < 420 ? 310 : 350;

  useEffect(() => {
    if (!HERO_SLIDES.length) return undefined;

    const timer = setInterval(() => {
      const next = (activeIndex + 1) % HERO_SLIDES.length;
      flatListRef.current?.scrollToIndex?.({ index: next, animated: true });
      setActiveIndex(next);
    }, 4200);

    return () => clearInterval(timer);
  }, [activeIndex]);

  return (
    <View
      style={[
        s.hero,
        isWeb && s.webBox,
        isWeb && s.heroWeb,
        !isWeb && isSmallPhone && s.heroMobileCompact,
        { height: heroHeight },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        keyExtractor={(item) => item.key}
        style={[s.heroSlider, { height: heroHeight, width: slideWidth }]}
        contentContainerStyle={{ height: heroHeight }}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setActiveIndex(next);
        }}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex?.({ index, animated: true });
          }, 50);
        }}
        renderItem={({ item }) => (
          <View
            style={[s.heroSlide, { width: slideWidth, height: heroHeight }]}
          >
            <Image
              source={item.source}
              style={[
                s.heroSlideBg,
                isWeb && item.position
                  ? { objectPosition: item.position }
                  : null,
              ]}
              resizeMode="cover"
            />
            <View style={s.heroSlideBgTint} />
          </View>
        )}
      />

      <View
        style={[
          s.heroContent,
          isWeb && s.heroContentWeb,
          !isWeb && s.heroContentMobile,
          isSmallPhone && s.heroContentCompact,
        ]}
      >
        <View style={s.heroEyebrow}>
          <Ionicons name="star" size={12} color={C.gold} />
          <Text style={s.heroEyebrowText}>Verified Expert</Text>
        </View>

        <Text
          style={[
            s.masterTitle,
            !isWeb && s.masterTitleMobile,
            isSmallPhone && s.masterTitleCompact,
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          Divine Master
        </Text>
        <Text
          style={[
            s.masterName,
            !isWeb && s.masterNameMobile,
            isSmallPhone && s.masterNameCompact,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          Pavneesh
        </Text>
        <Text
          style={[
            s.role,
            !isWeb && s.roleMobile,
            isSmallPhone && s.roleCompact,
          ]}
        >
          Personalized astrology guidance for love, career{"\n"}and life
          decisions
        </Text>

        <TouchableOpacity
          style={[s.bookBtn, !isWeb && s.bookBtnMobile]}
          onPress={() => navigation.navigate("Booking")}
        >
          <Text style={[s.bookText, !isWeb && s.bookTextMobile]}>
            Book Consultation
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            s.heroTrustLine,
            !isWeb && s.heroTrustLineMobile,
            isSmallPhone && s.heroTrustLineCompact,
          ]}
        >
          Private reading - Secure booking - Quick response
        </Text>
      </View>

      <View
        style={[
          s.heroStats,
          !isWeb && s.heroStatsMobile,
          isSmallPhone && s.heroStatsCompact,
        ]}
      >
        <View style={s.heroStatBox}>
          <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>20+</Text>
          <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
            Experience
          </Text>
        </View>
        <View style={s.heroStatDivider} />
        <View style={s.heroStatBox}>
          <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>5.0</Text>
          <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
            Trusted Rating
          </Text>
        </View>
        <View style={s.heroStatDivider} />
        <View style={s.heroStatBox}>
          <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>2.4k</Text>
          <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
            Sessions
          </Text>
        </View>
      </View>

      {HERO_SLIDES.length > 1 ? (
        <View style={[s.heroDots, !isWeb && s.heroDotsMobile]}>
          {HERO_SLIDES.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() =>
                flatListRef.current?.scrollToIndex?.({ index, animated: true })
              }
              style={[s.heroDot, activeIndex === index && s.heroDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BannerCarousel({ banners, width, navigation }) {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isWeb = Platform.OS === "web" && width > 800;
  const bannerWidth = isWeb
    ? Math.min(width - 120, 340)
    : Math.max(width - 84, 240);
  const bannerHeight = Math.round(bannerWidth * 1.22);
  const bannerMediaHeight = Math.round(bannerHeight * 0.66);
  const bannerGap = 12;
  const formatUSD = (value) => {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
  };

  useEffect(() => {
    if (!banners?.length) return undefined;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex?.({ index: next, animated: true });
      setActiveIndex(next);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeIndex, banners?.length]);

  const openBanner = (item) => {
    navigation.navigate("OfferDetail", {
      offerId: item?._id,
      offer: item,
    });
  };

  if (!banners?.length) {
    return (
      <View style={s.bannerEmpty}>
        <Ionicons name="sparkles-outline" size={24} color={C.gold} />
        <Text style={s.bannerEmptyTitle}>No banners published yet</Text>
        <Text style={s.bannerEmptyText}>
          Admin panel se new banners add karo, woh yahan dikh jayenge.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.bannerCarousel}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={bannerWidth + bannerGap}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={s.bannerListContent}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(
            e.nativeEvent.contentOffset.x / (bannerWidth + bannerGap)
          );
          setActiveIndex(next);
        }}
        getItemLayout={(_, index) => ({
          length: bannerWidth + bannerGap,
          offset: (bannerWidth + bannerGap) * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openBanner(item)}
            style={({ pressed }) => [
              s.bannerSlide,
              {
                width: bannerWidth,
                height: bannerHeight,
                marginRight: bannerGap,
              },
              pressed && s.pressed,
            ]}
          >
            <View style={[s.bannerSlideMedia, { height: bannerMediaHeight }]}>
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&q=80",
                }}
                style={s.bannerSlideImage}
                resizeMode="cover"
              />
            </View>
            <View style={s.bannerSlideContent}>
              <View style={s.bannerTopRow}>
                <Text style={s.bannerSlideKicker}>Featured</Text>
                {!!item.linkType && item.linkType !== "none" ? (
                  <View style={s.bannerSlideChip}>
                    <Text style={s.bannerSlideChipText}>{item.linkType}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={s.bannerSlideTitle} numberOfLines={2}>
                {item.title || "Special Offer"}
              </Text>
              <View style={s.bannerPriceRow}>
                <Text style={s.bannerOfferPrice}>
                  {formatUSD(item.offerPrice)}
                </Text>
                {Number(item.consultationPrice || 0) >
                Number(item.offerPrice || 0) ? (
                  <Text style={s.bannerOriginalPrice}>
                    {formatUSD(item.consultationPrice)}
                  </Text>
                ) : null}
              </View>
              {!!item.shortDescription || !!item.subtitle ? (
                <Text style={s.bannerSlideSub} numberOfLines={2}>
                  {item.shortDescription || item.subtitle}
                </Text>
              ) : null}
              <View style={s.bannerFooterRow}>
                <Text style={s.bannerSwipeHint}>Tap to view details</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}
      />

      {banners.length > 1 ? (
        <View style={s.bannerDots}>
          {banners.map((item, index) => (
            <Pressable
              key={item._id}
              onPress={() =>
                flatListRef.current?.scrollToIndex?.({ index, animated: true })
              }
              style={[s.bannerDot, activeIndex === index && s.bannerDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RashiCarousel({ rashis, width, navigation }) {
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Math.min(Math.max(width * 0.72, 230), 320);
  const cardGap = 12;

  const openRashi = (item) => {
    navigation.navigate("RashiDetail", {
      slug: item.slug || item.name,
      rashiSlug: item.slug || item.name,
      rashiName: item.name,
      imageUrl: item.imageUrl,
      initialRashi: item,
    });
  };

  if (!rashis?.length) {
    return (
      <View style={s.rashiEmpty}>
        <Ionicons name="moon-outline" size={24} color={C.gold} />
        <Text style={s.rashiEmptyTitle}>No rashi cards yet</Text>
        <Text style={s.rashiEmptyText}>
          Admin panel me rashi add karoge to yahan zodiac cards dikhne lagenge.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.rashiCarousel}>
      <FlatList
        ref={flatListRef}
        data={rashis}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        contentContainerStyle={s.rashiListContent}
        keyExtractor={(item) => item._id}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(
            e.nativeEvent.contentOffset.x / (cardWidth + cardGap)
          );
          setActiveIndex(next);
        }}
        getItemLayout={(_, index) => ({
          length: cardWidth + cardGap,
          offset: (cardWidth + cardGap) * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => openRashi(item)}
            style={({ pressed }) => [
              s.rashiCard,
              { width: cardWidth, marginRight: cardGap },
              pressed && s.pressed,
            ]}
          >
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  "https://images.unsplash.com/photo-1502657877623-f66bf489d236?w=1200&q=80",
              }}
              style={s.rashiImage}
              resizeMode="cover"
            />
            <View style={s.rashiOverlay} />
            <View style={s.rashiContent}>
              <View style={s.rashiHeaderRow}>
                <View style={s.rashiSymbolBox}>
                  <Text style={s.rashiSymbol}>{item.name?.[0] || "âœ¦"}</Text>
                </View>
                <View style={s.rashiMeta}>
                  <Text style={s.rashiName}>{item.name || "Rashi"}</Text>
                  {!!item.element ? (
                    <Text style={s.rashiElement}>{item.element}</Text>
                  ) : null}
                </View>
              </View>

              <Text style={s.rashiDesc} numberOfLines={2}>
                {item.shortDescription ||
                  item.description ||
                  "Tap to explore astrology details and guidance."}
              </Text>

              <View style={s.rashiFooterRow}>
                <Text style={s.rashiTapText}>Tap to explore</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}
      />

      {rashis.length > 1 ? (
        <View style={s.bannerDots}>
          {rashis.map((item, index) => (
            <Pressable
              key={item._id}
              onPress={() =>
                flatListRef.current?.scrollToIndex?.({ index, animated: true })
              }
              style={[s.bannerDot, activeIndex === index && s.bannerDotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const isDesktop = width >= 768;
  const isWeb = Platform.OS === "web" && width > 800;
  const isCompactPhone = width < 360;
  const isSmallPhone = width <= 390;
  const isStackedServices = width < 420;
  const isFoldPhone = width >= 320 && width < 420;
  const drawerWidth = Math.min(340, Math.round(width * 0.82));
  const bottomPadding = isDesktop
    ? 32
    : (isCompactPhone ? 84 : 96) + Math.max(insets.bottom, 10);
  const topPadding = isDesktop ? 88 : isCompactPhone ? 18 : 26;
  const contentHorizontalPadding = isDesktop ? 16 : isCompactPhone ? 12 : 16;

  // ---- Contact section responsive breakpoints (same as ContactUs.js) ----
  const contactIsWeb = width >= 900;
  const contactIsTablet = width >= 700;

  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [homeBanners, setHomeBanners] = useState([]);
  const [homeRashis, setHomeRashis] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [rashiLoading, setRashiLoading] = useState(true);
  const openLink = (url) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Link open nahi ho raha")
    );
  };

  const openScreen = (route) => {
    if (route === "Blog") {
      navigation.navigate("Blog", DEFAULT_BLOG_PARAMS);
      return;
    }

    navigation.navigate(route);
  };

  const openNotifications = () => {
    navigation.navigate("Notifications");
  };

  const openMenu = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (onDone) => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDrawerVisible(false);
        if (onDone) onDone();
      }
    });
  };

  const goTo = (route) => {
    if (route === "Profile" && !isAuthenticated) {
      closeMenu(() => navigation.navigate("Login", { redirectTo: "Profile" }));
      return;
    }
    closeMenu(() => navigation.navigate(route));
  };

  const translateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  useEffect(() => {
    let mounted = true;

    const loadBanners = async () => {
      try {
        setBannerLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/content/banners`);
        const data = await response.json();
        if (mounted && response.ok) {
          setHomeBanners(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (error) {
        if (mounted) setHomeBanners([]);
      } finally {
        if (mounted) setBannerLoading(false);
      }
    };

    const loadRashis = async () => {
      try {
        setRashiLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/content/rashis`);
        const data = await response.json();
        if (mounted && response.ok) {
          setHomeRashis(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (error) {
        if (mounted) setHomeRashis([]);
      } finally {
        if (mounted) setRashiLoading(false);
      }
    };

    loadBanners();
    loadRashis();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {!isDesktop ? (
        <View
          style={[
            s.header,
            {
              paddingTop: insets.top + (isCompactPhone ? 6 : 10),
              paddingLeft: Math.max(insets.left, isCompactPhone ? 12 : 16),
              paddingRight: Math.max(insets.right, isCompactPhone ? 12 : 16),
            },
          ]}
        >
          <View style={[s.logoBox, isCompactPhone && s.logoBoxCompact]}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={[s.logoImage, isCompactPhone && s.logoImageCompact]}
              resizeMode="contain"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[s.brand, isCompactPhone && s.brandCompact]}>
              Evdivine
            </Text>
            <Text style={[s.tag, isCompactPhone && s.tagCompact]}>
              ANCIENT WISDOM
            </Text>
          </View>

          <View
            style={[s.headerActions, isCompactPhone && s.headerActionsCompact]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={openNotifications}
              style={({ pressed }) => [
                s.iconBtn,
                isCompactPhone && s.iconBtnCompact,
                pressed && s.pressed,
              ]}
              hitSlop={10}
            >
              <Ionicons
                name="notifications-outline"
                size={isCompactPhone ? 20 : 23}
                color={C.gold}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              onPress={openMenu}
              style={({ pressed }) => [
                s.menuBtn,
                isCompactPhone && s.menuBtnCompact,
                pressed && s.pressed,
              ]}
              hitSlop={10}
            >
              <Ionicons
                name="menu"
                size={isCompactPhone ? 21 : 24}
                color={C.gold}
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={s.screenBody}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scroll,
            isDesktop && s.scrollDesktop,
            {
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: contentHorizontalPadding,
            },
          ]}
        >
          <HeroSlider
            width={width}
            isWeb={isWeb}
            isSmallPhone={isSmallPhone}
            navigation={navigation}
          />

          <PageContentSection
            pageKey="home-page"
            hideHeader
            centerBody
            hideKeywords
          />

          {false && (
            <View style={[s.hero, isWeb && s.webBox, isWeb && s.heroWeb]}>
              <Image
                source={IMAGES.hero}
                style={[s.heroImg, isWeb && s.heroImgWeb]}
                resizeMode="cover"
              />
              <View style={s.overlay} />

              <View
                style={[
                  s.heroContent,
                  isWeb && s.heroContentWeb,
                  isSmallPhone && s.heroContentCompact,
                ]}
              >
                <Text
                  style={[s.masterTitle, isSmallPhone && s.masterTitleCompact]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  Divine Master
                </Text>
                <Text
                  style={[s.masterName, isSmallPhone && s.masterNameCompact]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Pavneesh
                </Text>
                <Text style={[s.role, isSmallPhone && s.roleCompact]}>
                  Psychic Â· Astro Guru{"\n"}Spiritual Personal Advisor
                </Text>

                <TouchableOpacity
                  style={s.bookBtn}
                  onPress={() => navigation.navigate("Booking")}
                >
                  <Text style={s.bookText}>Book Consultation</Text>
                </TouchableOpacity>
              </View>

              <View style={[s.heroStats, isSmallPhone && s.heroStatsCompact]}>
                <View style={s.heroStatBox}>
                  <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>
                    20+
                  </Text>
                  <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
                    Years Exp.
                  </Text>
                </View>
                <View style={s.heroStatDivider} />
                <View style={s.heroStatBox}>
                  <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>
                    5.0
                  </Text>
                  <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
                    Rating
                  </Text>
                </View>
                <View style={s.heroStatDivider} />
                <View style={s.heroStatBox}>
                  <Text style={[s.statNo, isSmallPhone && s.statNoCompact]}>
                    2.4k
                  </Text>
                  <Text style={[s.statText, isSmallPhone && s.statTextCompact]}>
                    Sessions
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>My Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Services")}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              s.grid,
              isWeb && s.gridWeb,
              isStackedServices && s.gridPhoneStack,
            ]}
          >
            {services.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  s.serviceCard,
                  isWeb && s.serviceCardWeb,
                  isStackedServices && s.serviceCardPhoneStack,
                ]}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    s.serviceMedia,
                    !isStackedServices && s.serviceMediaRatio,
                    isStackedServices && s.serviceMediaCompact,
                  ]}
                >
                  <Image
                    source={
                      typeof item.img === "string"
                        ? { uri: item.img }
                        : item.img
                    }
                    style={[
                      s.serviceImg,
                      isStackedServices && s.serviceImgCompact,
                    ]}
                    resizeMode="cover"
                  />
                </View>

                <View
                  style={[s.cardBody, isStackedServices && s.cardBodyCompact]}
                >
                  <View
                    style={[s.iconBox, isStackedServices && s.iconBoxCompact]}
                  >
                    {typeof item.img === "string" ? (
                      <Text
                        style={[s.icon, isStackedServices && s.iconCompact]}
                      >
                        {item.icon}
                      </Text>
                    ) : (
                      <Image
                        source={item.img}
                        style={s.iconImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      s.serviceTitle,
                      isStackedServices && s.serviceTitleCompact,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      s.serviceText,
                      isStackedServices && s.serviceTextCompact,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Latest Offers</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Booking")}>
              <Text style={s.seeAll}>Book Now</Text>
            </TouchableOpacity>
          </View>

          {bannerLoading ? (
            <View
              style={[
                s.bannerCarousel,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={s.bannerCarouselTitle}>Loading banners...</Text>
            </View>
          ) : (
            <BannerCarousel
              banners={homeBanners}
              width={width}
              navigation={navigation}
            />
          )}

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Choose Your Rashi</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AstrologyConsultation")}
            >
              <Text style={s.seeAll}>Explore</Text>
            </TouchableOpacity>
          </View>

          {rashiLoading ? (
            <View
              style={[
                s.bannerCarousel,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={s.bannerCarouselTitle}>Loading rashi cards...</Text>
            </View>
          ) : (
            <RashiCarousel
              rashis={homeRashis}
              width={width}
              navigation={navigation}
            />
          )}

          <View style={[s.banner, isWeb && s.webBox, { display: "none" }]}>
            <Text style={s.bannerTitle}>Ready for Clarity?</Text>
            <Text style={s.bannerSub}>First session starting at â‚¹99</Text>

            <TouchableOpacity
              style={s.bannerBtn}
              onPress={() => navigation.navigate("Booking")}
            >
              <Text style={s.bannerBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>

          {/* ================= CONTACT US SECTION (merged from ContactUs.js) ================= */}

          {/* Hero */}
          <View
            style={[
              cs.hero,
              isFoldPhone && { minHeight: 220, paddingHorizontal: 14 },
            ]}
          >
            <Text
              style={[
                cs.heroTitle,
                isFoldPhone && { fontSize: 28, lineHeight: 34 },
              ]}
            >
              Contact Us
            </Text>
            <Text
              style={[
                cs.heroSub,
                isFoldPhone && {
                  fontSize: 13,
                  lineHeight: 20,
                  marginTop: 10,
                  maxWidth: 320,
                },
              ]}
            >
              We're here to help! Reach out to us for any questions, support or
              guidance.
            </Text>

            <View
              style={[
                cs.heroDivider,
                isFoldPhone && { marginTop: 16, gap: 10 },
              ]}
            >
              <View style={[cs.line, isFoldPhone && { width: 38 }]} />
              <Ionicons
                name="star"
                size={isFoldPhone ? 16 : 18}
                color="#B55CFF"
              />
              <View style={[cs.line, isFoldPhone && { width: 38 }]} />
            </View>

            <Text style={cs.zodiac}>âœ§ âœ¦ âœ§ âœ¦ âœ§</Text>
          </View>

          {/* Contact Cards */}
          <View
            style={[
              cs.contactCards,
              isFoldPhone && { gap: 10, marginTop: 12 },
              { flexDirection: contactIsTablet ? "row" : "column" },
            ]}
          >
            <InfoCard
              icon="location"
              title="Our Location"
              text="Jyotish Sadan, 9/959, Sector 9, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India"
              color="#C06A3B"
            />
            <InfoCard
              icon="call"
              title="whatsapp "
              text="+91 99996 29808"
              sub="Mon - Sat | 9AM - 6PM"
              color="#31B65D"
              onPress={() => openLink("tel:+919999629808")}
            />
            <InfoCard
              icon="mail"
              title="Email Us"
              text="support@evdivine.com"
              sub="We reply within 24 hours"
              color="#2F80ED"
              onPress={() => openLink("mailto:support@evdivine.com")}
            />
            <InfoCard
              icon="time"
              title="Working Hours"
              text="Mon - Sat"
              sub="9:00 AM - 6:00 PM"
              color="#F97316"
            />
          </View>

          {/* Map */}
          <View style={[cs.middleRow, isFoldPhone && { gap: 12 }]}>
            <OfficeLocationSection
              styles={cs}
              mapBoxStyle={isFoldPhone ? { height: 220 } : null}
              compactActionStyle={isFoldPhone ? cs.mapActionBtnCompact : null}
              address="Jyotish Sadan, 9/959, Sector 9, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India"
              addressLines={[
                "Jyotish Sadan",
                "9/959, Sector 9",
                "Vasundhara, Ghaziabad",
              ]}
            />
          </View>

          {/* Features */}
          <View
            style={[
              cs.features,
              isFoldPhone && { padding: 16, gap: 14 },
              { flexDirection: contactIsWeb ? "row" : "column" },
            ]}
          >
            <Feature
              icon="headset"
              title="24/7 Support"
              text="We are always here for you anytime."
            />
            <Feature
              icon="shield-checkmark-outline"
              title="Trusted & Secure"
              text="Your information is 100% safe with us."
            />
            <Feature
              icon="people-outline"
              title="Expert Guidance"
              text="Connect with verified psychics & experts."
            />
            <Feature
              icon="heart-outline"
              title="Customer First"
              text="Your satisfaction is our top priority."
            />
          </View>

          {/* Social */}
          <View
            style={[cs.socialSection, isFoldPhone && { paddingVertical: 18 }]}
          >
            <View style={[cs.followRow, isFoldPhone && { gap: 10 }]}>
              <View style={[cs.smallLine, isFoldPhone && { width: 24 }]} />
              <Text style={[cs.followTitle, isFoldPhone && { fontSize: 16 }]}>
                Follow Us On
              </Text>
              <View style={[cs.smallLine, isFoldPhone && { width: 24 }]} />
            </View>

            <View
              style={[cs.socialRow, isFoldPhone && { gap: 10, marginTop: 14 }]}
            >
              <Social
                name="facebook"
                color="#1877F2"
                url="https://www.facebook.com/profile.php?id=61591671718130&sk=directory_contact_info&fb_profile_edit_entry_point=%7B%22feature%22%3A%22profile_directory%22%2C%22click_point%22%3A%22pencil_edit_directory_section%22%2C%22additional_metadata%22%3A%7B%22section_type%22%3A%22contact_info%22%7D%7D"
              />
              <Social
                name="linkedin"
                color="#0077B5"
                url="https://www.linkedin.com/company/evdivine"
              />
              <Social
                name="instagram"
                color="#E1306C"
                url="https://www.instagram.com/evdivinepsychic/ "
              />
              <Social
                name="pinterest"
                color="#E60023"
                url="http://www.pinterest.com/evdivineastro"
              />
              <Social
                name="twitter"
                color="#1DA1F2"
                url="https://twitter.com"
              />
              <Social
                name="youtube-play"
                color="#FF0000"
                url="https://www.youtube.com/@evdivine-lovereading"
              />
              <Social
                name="whatsapp"
                color="#25D366"
                url="https://wa.me/919999629808"
              />
            </View>

            <Text
              style={[
                cs.socialText,
                isFoldPhone && { marginTop: 14, fontSize: 12 },
              ]}
            >
              Stay connected for latest updates, offers and spiritual insights.
            </Text>
          </View>

          {/* Footer */}
          <View
            style={[
              cs.footer,
              isFoldPhone && {
                paddingHorizontal: 16,
                paddingTop: 20,
                borderRadius: 20,
              },
            ]}
          >
            <View
              style={[
                cs.footerGrid,
                isFoldPhone && { gap: 20 },
                { flexDirection: contactIsWeb ? "row" : "column" },
              ]}
            >
              <View style={cs.footerCol}>
                <View style={cs.footerLogoRow}>
                  <Text style={cs.logoIcon}></Text>
                  <Text
                    style={[cs.footerLogo, isFoldPhone && { fontSize: 20 }]}
                  >
                    EvDivine
                  </Text>
                </View>
                <Text
                  style={[
                    cs.footerText,
                    isFoldPhone && { fontSize: 12, lineHeight: 18 },
                  ]}
                >
                  EvDivine is a trusted platform that connects you with
                  experienced psychics and spiritual guides.
                </Text>
              </View>

              <FooterList
                title="Quick Links"
                items={quickLinks}
                onPressItem={openScreen}
              />
              <FooterList
                title="Our Services"
                items={serviceLinks}
                onPressItem={openScreen}
              />

              <View style={cs.footerCol}>
                <Text style={cs.footerTitle}>Contact Info</Text>
                <Text style={cs.footerText}>
                  Address: Jyotish Sadan, 9/959, Sector 9, Vasundhara,
                  Ghaziabad, Uttar Pradesh 201012, India
                </Text>
                <Text style={cs.footerText}>Phone: +91 99996 29808</Text>
                <Text style={cs.footerText}>Email: support@evdivine.com</Text>
              </View>
            </View>

            <View style={cs.copyright}>
              <Text style={cs.copyText}>
                2026 EvDivine. All Rights Reserved.
              </Text>
              <Text style={cs.copyText}>
                Privacy Policy | Terms & Conditions
              </Text>
            </View>
          </View>

          {/* ================= END CONTACT US SECTION ================= */}
        </ScrollView>

        {drawerVisible ? (
          <View style={s.drawerLayer} pointerEvents="box-none">
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => closeMenu()}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "#000",
                    opacity: backdropOpacity,
                  },
                ]}
              />
            </Pressable>

            <Animated.View
              style={[
                s.drawer,
                {
                  width: drawerWidth,
                  transform: [{ translateX }],
                },
              ]}
            >
              <View style={s.drawerHero}>
                <View style={s.drawerHeroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.drawerKicker}>Quick Menu</Text>
                    <Text style={s.drawerTitle}>Choose a page</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                    onPress={() => closeMenu()}
                    style={({ pressed }) => [s.closeBtn, pressed && s.pressed]}
                    hitSlop={10}
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </Pressable>
                </View>
                <Text style={s.drawerSub}>
                  Home page se direct aur fast navigation.
                </Text>
              </View>

              <View style={s.menuList}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.route}
                    accessibilityRole="button"
                    onPress={() => goTo(item.route)}
                    style={({ pressed }) => [
                      s.menuItem,
                      pressed && s.menuItemPressed,
                    ]}
                  >
                    <View style={s.menuIcon2}>
                      <Ionicons name={item.icon} size={22} color={C.gold} />
                    </View>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color={C.sub} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/* ===================== Contact section helper components ===================== */

function InfoCard({ icon, title, text, sub, color, onPress }) {
  return (
    <TouchableOpacity
      style={cs.infoCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[cs.iconCircle, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={cs.cardTitle}>{title}</Text>
      <Text style={cs.cardText}>{text}</Text>
      {sub ? <Text style={cs.cardSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function Feature({ icon, title, text }) {
  return (
    <View style={cs.featureItem}>
      <View style={cs.featureIcon}>
        <Ionicons name={icon} size={28} color="#C06A3B" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cs.featureTitle}>{title}</Text>
        <Text style={cs.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function Social({ name, color, url }) {
  return (
    <TouchableOpacity
      style={cs.socialIcon}
      onPress={() => Linking.openURL(url)}
    >
      <FontAwesome name={name} size={25} color={color} />
    </TouchableOpacity>
  );
}

function FooterList({ title, items, onPressItem }) {
  return (
    <View style={cs.footerCol}>
      <Text style={cs.footerTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.75}
          onPress={() => onPressItem(item.route)}
        >
          <Text style={cs.footerLink}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ===================== Original HomeScreen styles ===================== */

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  screenBody: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: "#F4E0B7",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(163,75,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionsCompact: {
    gap: 4,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(163,75,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 6,
  },
  menuBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },
  logoBoxCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
  },
  logoImage: {
    width: 46,
    height: 46,
  },
  logoImageCompact: {
    width: 40,
    height: 40,
  },
  brand: {
    color: C.gold,
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "serif",
  },
  brandCompact: {
    fontSize: 20,
  },
  tag: {
    color: C.sub,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  tagCompact: {
    fontSize: 9,
    letterSpacing: 1.4,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  scrollCompactPhone: {
    paddingHorizontal: 12,
  },
  scrollDesktop: {
    paddingTop: 0,
  },
  hero: {
    minHeight: 339,
    backgroundColor: C.card,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },
  heroWeb: {
    minHeight: 470,
  },
  heroMobileCompact: {
    borderRadius: 24,
  },
  heroSmallPhone: {
    minHeight: 600,
  },
  heroSlider: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  heroSlide: {
    position: "relative",
    height: "100%",
    overflow: "hidden",
  },
  heroSlideBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.95,
  },
  heroSlideBgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(163,75,31,0.18)",
  },
  heroSlideFg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  webBox: {
    maxWidth: 1050,
    width: "100%",
    alignSelf: "center",
  },
  heroImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroImgWeb: {
    objectPosition: "center top",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248,232,199,0.14)",
  },
  heroContent: {
    flex: 1,
    padding: 24,
    zIndex: 2,
    paddingBottom: 120,
    maxWidth: 360,
  },
  heroContentMobile: {
    padding: 16,
    paddingRight: 96,
    paddingBottom: 108,
    maxWidth: 300,
  },
  heroContentCompact: {
    padding: 14,
    paddingRight: 88,
    paddingBottom: 104,
    maxWidth: "100%",
  },
  heroContentWeb: {
    paddingLeft: 28,
    paddingTop: 28,
    paddingRight: 42,
    paddingBottom: 128,
    maxWidth: 390,
  },
  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,247,233,0.82)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    marginBottom: 14,
  },
  heroEyebrowText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  masterTitle: {
    color: C.gold,
    fontSize: 38,
    fontWeight: "900",
    fontFamily: "serif",
    lineHeight: 42,
  },
  masterTitleCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  masterTitleMobile: {
    fontSize: 26,
    lineHeight: 30,
  },
  masterName: {
    color: C.sub,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  masterNameMobile: {
    fontSize: 14,
    letterSpacing: 0.6,
  },
  masterNameCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  role: {
    color: "#6E4A36",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 300,
  },
  roleMobile: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 210,
    marginBottom: 14,
  },
  roleCompact: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  bookBtn: {
    backgroundColor: C.gold,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bookBtnMobile: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  bookText: {
    color: "#FFF8EE",
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  bookTextMobile: {
    fontSize: 13,
  },
  statNo: {
    color: C.gold,
    fontSize: 21,
    fontWeight: "900",
  },
  statNoCompact: {
    fontSize: 18,
  },
  statText: {
    color: "#7E5A44",
    fontSize: 10,
    marginTop: 5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statTextCompact: {
    fontSize: 10,
  },
  heroStats: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    zIndex: 3,
    backgroundColor: "rgba(255,247,233,0.88)",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroStatsMobile: {
    left: 14,
    right: 14,
    bottom: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  heroStatsCompact: {
    left: 12,
    right: 12,
    bottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  heroStatBox: {
    flex: 1,
    alignItems: "center",
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(163,75,31,0.12)",
  },
  heroDots: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    zIndex: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  heroDotsMobile: {
    bottom: 90,
  },
  heroDot: {
    width: 7,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(163,75,31,0.20)",
  },
  heroDotActive: {
    width: 28,
    backgroundColor: C.gold,
  },
  heroTrustLine: {
    color: "#7F5E4A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroTrustLineMobile: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
  },
  heroTrustLineCompact: {
    fontSize: 10,
    lineHeight: 15,
  },
  sectionRow: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "900",
  },
  seeAll: {
    color: C.gold,
    fontWeight: "800",
  },
  bannerCarousel: {
    marginTop: 4,
    marginBottom: 20,
  },
  bannerEmpty: {
    minHeight: 190,
    borderRadius: 26,
    marginHorizontal: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  bannerEmptyTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  bannerEmptyText: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  bannerListContent: {
    paddingHorizontal: 16,
  },
  bannerCarouselTitle: {
    color: C.sub,
    fontWeight: "800",
    padding: 16,
  },
  bannerSlide: {
    height: 420,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  bannerSlideMedia: {
    height: 300,
    backgroundColor: "#FFF8EE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bannerSlideImage: {
    width: "100%",
    height: "100%",
  },
  bannerSlideContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
    backgroundColor: "#FDF1DE",
  },
  bannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bannerSlideKicker: {
    color: C.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  bannerSlideTitle: {
    color: "#6A2B1A",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  bannerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  bannerOfferPrice: {
    color: "#A34B1F",
    fontSize: 19,
    fontWeight: "900",
  },
  bannerOriginalPrice: {
    color: "#8E6D56",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "line-through",
  },
  bannerSlideSub: {
    color: "#7C4C35",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: "90%",
    marginTop: 4,
  },
  bannerSlideChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.10)",
    marginTop: 6,
  },
  bannerSlideChipText: {
    color: "#6A2B1A",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bannerFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerSwipeHint: {
    color: "rgba(106,43,26,0.85)",
    fontSize: 12,
    fontWeight: "700",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 0,
  },
  bannerDotActive: {
    width: 22,
    backgroundColor: C.gold,
  },
  rashiCarousel: {
    marginTop: 4,
    marginBottom: 10,
  },
  rashiListContent: {
    paddingHorizontal: 16,
  },
  rashiEmpty: {
    minHeight: 170,
    borderRadius: 26,
    marginHorizontal: 16,
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  rashiEmptyTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  rashiEmptyText: {
    color: C.sub,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  rashiCard: {
    height: 380,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  rashiImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  rashiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,4,26,0.55)",
  },
  rashiContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(7,4,26,0.08)",
  },
  rashiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rashiSymbolBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rashiSymbol: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  rashiMeta: {
    flex: 1,
  },
  rashiName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  rashiElement: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  rashiDesc: {
    color: "#F4ECFF",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    maxWidth: "92%",
  },
  rashiFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  rashiTapText: {
    color: C.gold,
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: "hidden",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      web: {
        boxShadow: "0px 0px 24px rgba(0,0,0,0.35)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: -4, height: 0 },
        elevation: 18,
      },
    }),
  },
  drawerHero: {
    margin: 16,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  drawerHeroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  drawerKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  drawerTitle: {
    fontFamily: "serif",
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  drawerSub: {
    marginTop: 10,
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 19,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  menuItemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  menuIcon2: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(163,75,31,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridWeb: {
    maxWidth: 1050,
    alignSelf: "center",
  },
  gridPhoneStack: {
    flexDirection: "column",
  },
  serviceCard: {
    width: "48%",
    backgroundColor: C.card,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },
  serviceCardWeb: {
    width: "31.8%",
  },
  serviceCardPhoneStack: {
    width: "100%",
  },
  serviceMedia: {
    width: "100%",
    position: "relative",
    backgroundColor: "#FFF2DE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  serviceMediaRatio: {
    aspectRatio: 1.18,
  },
  serviceMediaCompact: {
    height: 240,
  },
  serviceImg: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    zIndex: 2,
  },
  serviceImgCompact: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    padding: 14,
  },
  cardBodyCompact: {
    padding: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F9E4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 0,
    overflow: "hidden",
  },
  iconBoxCompact: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginBottom: 10,
    marginTop: 0,
  },
  icon: {
    fontSize: 26,
  },
  iconCompact: {
    fontSize: 22,
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  serviceTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  serviceTitleCompact: {
    fontSize: 14,
  },
  serviceText: {
    color: C.sub,
    fontSize: 12,
    lineHeight: 18,
  },
  serviceTextCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  banner: {
    marginTop: 24,
    backgroundColor: C.gold,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  bannerTitle: {
    color: "#1A0600",
    fontSize: 22,
    fontWeight: "900",
  },
  bannerSub: {
    color: "#3A1200",
    marginTop: 6,
    marginBottom: 16,
    fontWeight: "600",
  },
  bannerBtn: {
    backgroundColor: "#1A0600",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    color: C.gold,
    fontWeight: "900",
  },
});

/* ===================== Contact section styles (from ContactUs.js) ===================== */

const cs = StyleSheet.create({
  hero: {
    backgroundColor: "#2E160B",
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    overflow: "hidden",
    borderRadius: 24,
    marginTop: 10,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },

  heroSub: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 520,
  },

  heroDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 14,
  },

  line: {
    width: 70,
    height: 2,
    backgroundColor: "#C06A3B",
  },

  zodiac: {
    position: "absolute",
    left: 20,
    top: 20,
    color: "#A34B1F",
    fontSize: 60,
    opacity: 0.25,
  },

  contactCards: {
    marginTop: 16,
    gap: 14,
  },

  infoCard: {
    flex: 1,
    minHeight: 195,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "900",
    color: "#10172A",
    textAlign: "center",
  },

  cardText: {
    marginTop: 8,
    fontSize: 13,
    color: "#243047",
    textAlign: "center",
    lineHeight: 20,
  },

  cardSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },

  middleRow: {
    marginTop: 22,
    gap: 16,
  },

  whiteBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  boxTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#10172A",
  },

  mapBox: {
    height: 300,
    borderRadius: 12,
    backgroundColor: "#EAF2FA",
    borderWidth: 1,
    borderColor: "#D8E1EC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  mapFakeText: {
    position: "absolute",
    top: 40,
    left: 60,
    fontSize: 15,
    color: "#1F6FB2",
    fontWeight: "700",
  },

  mapRoad: {
    position: "absolute",
    top: 105,
    left: 40,
    color: "#1A73E8",
    fontSize: 14,
  },

  mapRoadRight: {
    position: "absolute",
    top: 120,
    right: 20,
    color: "#159447",
    fontSize: 14,
  },

  mapActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    width: "100%",
  },

  mapActionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    flexGrow: 1,
  },

  mapActionBtnCompact: {
    flexGrow: 0,
    width: "100%",
  },

  mapActionPrimary: {
    backgroundColor: "#7C3AED",
  },

  mapActionSoft: {
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.18)",
  },

  mapActionPrimaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  mapActionSoftText: {
    color: "#A34B1F",
    fontSize: 12,
    fontWeight: "800",
  },

  locationNoteBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF7E9",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locationNoteText: {
    flex: 1,
    color: "#7C4C35",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },

  locationResultBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(49,182,93,0.10)",
    borderWidth: 1,
    borderColor: "rgba(49,182,93,0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locationResultText: {
    flex: 1,
    color: "#256A3C",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },

  inputRow: {
    gap: 12,
  },

  inputBox: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#111827",
  },

  textAreaBox: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: "#DCE3EE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 13,
    marginBottom: 18,
    flexDirection: "row",
    gap: 10,
  },

  textArea: {
    flex: 1,
    minHeight: 85,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#8B2BE2",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  features: {
    marginTop: 22,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 22,
    gap: 18,
    elevation: 4,
  },

  featureItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  featureIcon: {
    width: 54,
    height: 54,
    borderRadius: 35,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#10172A",
  },

  featureText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 5,
    lineHeight: 20,
  },

  socialSection: {
    alignItems: "center",
    paddingVertical: 28,
  },

  followRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  smallLine: {
    width: 36,
    height: 2,
    backgroundColor: "#C06A3B",
  },

  followTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#10172A",
  },

  socialRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  socialIcon: {
    width: 52,
    height: 52,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  socialText: {
    marginTop: 18,
    color: "#334155",
    textAlign: "center",
    fontSize: 13,
  },

  footer: {
    backgroundColor: "#4A2516",
    borderTopWidth: 4,
    borderTopColor: "#C06A3B",
    paddingHorizontal: 24,
    paddingTop: 28,
    borderRadius: 24,
    marginTop: 10,
  },

  footerGrid: {
    gap: 32,
  },

  footerCol: {
    flex: 1,
  },

  footerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logoIcon: {
    fontSize: 28,
    color: "#FFD250",
  },

  footerLogo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  footerText: {
    color: "#D6D5E6",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  footerTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },

  footerLink: {
    color: "#D6D5E6",
    fontSize: 13,
    marginBottom: 9,
  },

  copyright: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  copyText: {
    color: "#D6D5E6",
    fontSize: 12,
  },
});
