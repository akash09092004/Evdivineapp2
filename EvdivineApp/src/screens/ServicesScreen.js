import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from '../components/LinearGradient';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { Colors, Shadows } from '../theme/colors';

const services = [
  {
    icon: '🃏',
    name: 'Tarot Reading',
    desc: 'Get insights about your future with tarot cards.',
    tag: 'Popular',
    rating: 4.9,
    price: '₹299',
    accentColors: ['#5B1F73', '#D6336C'],
    iconBg: ['#F1E3FB', '#EDD5FA'],
  },
  {
    icon: '🌟',
    name: 'Astrology Consultation',
    desc: 'Know about your stars and planetary positions.',
    tag: 'Popular',
    rating: 4.8,
    price: '₹499',
    accentColors: ['#5B1F73', '#D6336C'],
    iconBg: ['#FCE4F2', '#F5D0E8'],
  },
  {
    icon: '✋',
    name: 'Palm Reading',
    desc: 'Discover your life path through palm analysis.',
    rating: 4.7,
    price: '₹249',
    accentColors: ['#A066C0', '#C23370'],
    iconBg: ['#F1E3FB', '#EDD5FA'],
  },
  {
    icon: '🏡',
    name: 'Vastu Consultation',
    desc: 'Bring positivity and harmony to your space.',
    rating: 4.6,
    price: '₹999',
    accentColors: ['#A066C0', '#C23370'],
    iconBg: ['#FCE4F2', '#F5D0E8'],
  },
  {
    icon: '🔢',
    name: 'Numerology',
    desc: 'Find your lucky numbers and hidden energies.',
    rating: 4.7,
    price: '₹199',
    accentColors: ['#A066C0', '#C23370'],
    iconBg: ['#F1E3FB', '#EDD5FA'],
  },
  {
    icon: '✨',
    name: 'Aura Reading',
    desc: 'Know about your aura and energy field.',
    tag: 'New',
    rating: 4.5,
    price: '₹349',
    accentColors: ['#15803D', '#22C55E'],
    iconBg: ['#DCFCE7', '#BBF7D0'],
  },
];

const FILTERS = ['All', 'Popular', 'New'];

const COSMIC = {
  deep: '#5B2A12',
  mid: '#A34B1F',
  vivid: '#E9A64D',
  tint: '#FFF1D8',
  blush: '#F4DCB0',
  bg: '#F8E8C7',
};

const TAG_GRADIENTS = {
  Popular: ['#5B1F73', '#D6336C'],
  New: ['#15803D', '#22C55E'],
};

const TAB_BAR_SPACER = 120;

const SERVICE_ROUTES = {
  'Tarot Reading': 'TarotReading',
  'Astrology Consultation': 'AstrologyConsultation',
  'Palm Reading': 'PalmReading',
  'Vastu Consultation': 'VastuConsultation',
  Numerology: 'Numerology',
  'Aura Reading': 'AuraReading',
};

export default function ServicesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const isDesktop = width >= 768;
  const tabBarSpacer = isDesktop ? 28 : TAB_BAR_SPACER;

  const numColumns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
  const isGrid = numColumns > 1;
  const cardCellWidth = isGrid
    ? (width - 44 - (numColumns - 1) * 12) / numColumns
    : '100%';

  const filteredServices =
    activeFilter === 'All'
      ? services
      : services.filter((s) => s.tag === activeFilter);

  const goToService = (service) => {
    const route = SERVICE_ROUTES[service.name];
    if (route) {
      navigation.navigate(route);
      return;
    }
    navigation.navigate('Booking', { service: service.name });
  };

  const renderCard = (s, index) => (
    <View
      key={s.name}
      style={
        isGrid
          ? [styles.cardCellGrid, { width: cardCellWidth }]
          : styles.cardCell
      }
    >
      <Pressable
        style={({ pressed, hovered }) => [
          styles.card,
          isGrid && styles.cardGrid,
          hovered && styles.cardHover,
          pressed && styles.cardPressed,
        ]}
        onPress={() => goToService(s)}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={s.accentColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.accentBar, isGrid && styles.accentBarGrid]}
        />

        {/* Badge */}
        {s.tag ? (
          <LinearGradient
            colors={TAG_GRADIENTS[s.tag] || TAG_GRADIENTS.Popular}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{s.tag}</Text>
          </LinearGradient>
        ) : null}

        <View style={[styles.cardContent, isGrid && styles.cardContentGrid]}>
          {/* Icon box */}
          <LinearGradient
            colors={s.iconBg}
            style={[styles.iconBox, isGrid && styles.iconBoxGrid]}
          >
            <Text style={[styles.iconText, isGrid && styles.iconTextGrid]}>
              {s.icon}
            </Text>
          </LinearGradient>

          {/* Info */}
          <View style={[styles.info, isGrid && styles.infoGrid]}>
            <View>
              <Text style={styles.name} numberOfLines={1}>
                {s.name}
              </Text>
              <Text
                style={styles.desc}
                numberOfLines={isGrid ? 3 : 2}
              >
                {s.desc}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.ratingText}>⭐ {s.rating}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.priceText}>{s.price}</Text>
              </View>
            </View>

            {isGrid && (
              <LinearGradient
                colors={[COSMIC.deep, COSMIC.vivid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.consultBtn}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.consultBtnPressable,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => goToService(s)}
                >
                  <Text style={styles.consultBtnText}>Consult Now</Text>
                </Pressable>
              </LinearGradient>
            )}
          </View>

          {!isGrid && (
            <Text style={styles.chevron}>›</Text>
          )}
        </View>
      </Pressable>
    </View>
  );

  return (
    <ResponsiveScreen backgroundColor={COSMIC.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

        {/* ── TOP NAV ── */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
          {/* Back button — fixed & always visible */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoRow}>
              <Text style={styles.logoEmoji}>🪷</Text>
              <Text style={styles.logoText}>Evdivine</Text>
            </View>
            <Text style={styles.logoTagline}>ANCIENT WISDOM</Text>
          </View>

          {/* Online badge */}
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>128 online</Text>
          </View>
        </View>

        {/* ── SCROLLABLE CONTENT ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarSpacer }]}
        >
          {/* ── HERO BANNER ── */}
          <View style={[styles.heroWrap, isGrid && styles.heroWrapWide]}>
            <LinearGradient
              colors={[COSMIC.deep, COSMIC.mid, COSMIC.vivid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, isGrid && styles.heroWide]}
            >
              {/* Decorative orb circles */}
              <View style={styles.orb1} />
              <View style={styles.orb2} />

              {/* Star dots */}
              <View style={[styles.starDot, { top: 14, right: 90, width: 4, height: 4 }]} />
              <View style={[styles.starDot, { top: 32, right: 62, width: 3, height: 3, opacity: 0.6 }]} />
              <View style={[styles.starDot, { top: 54, right: 98, width: 5, height: 5 }]} />
              <View style={[styles.starDot, { top: 22, right: 40, width: 2, height: 2, opacity: 0.5 }]} />
              {/* Star connector lines */}
              <View style={[styles.starLine, { top: 19, right: 66, width: 38, transform: [{ rotate: '26deg' }] }]} />
              <View style={[styles.starLine, { top: 45, right: 66, width: 40, transform: [{ rotate: '-18deg' }] }]} />

              <View style={isGrid ? styles.heroRow : undefined}>
                <View style={isGrid ? styles.heroTextBlock : undefined}>
                  <Text style={styles.heroEyebrow}>EXPLORE</Text>
                  <Text style={[styles.heroTitle, isGrid && styles.heroTitleWide]}>
                    Our Services
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    Choose a path to clarity —{'\n'}guided by ancient wisdom
                  </Text>
                </View>
                {isGrid && (
                  <Text style={styles.heroEmoji}>🔮</Text>
                )}
              </View>

              {/* Crystal ball — mobile only, floating */}
              {!isGrid && (
                <Text style={styles.heroCrystalMobile}>🔮</Text>
              )}
            </LinearGradient>
          </View>

          {/* ── STATS STRIP ── */}
          <View style={[styles.statsStrip, isGrid && styles.statsStripWide]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>750+</Text>
              <Text style={styles.statLabel}>Trusted Gurus</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8 ⭐</Text>
              <Text style={styles.statLabel}>User Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>50K+</Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </View>
          </View>

          {/* ── FILTER CHIPS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTERS.map((f) => {
              const active = activeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={({ pressed }) => pressed && { opacity: 0.8 }}
                >
                  {active ? (
                    <LinearGradient
                      colors={[COSMIC.deep, COSMIC.vivid]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.chip}
                    >
                      <Text style={styles.chipTextActive}>{f}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.chip, styles.chipInactive]}>
                      <Text style={styles.chipText}>{f}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── SECTION HEADER ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === 'All' ? 'All Services' : `${activeFilter} Services`}
            </Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{filteredServices.length} available</Text>
            </View>
          </View>

          {/* ── CARDS LIST / GRID ── */}
          <View style={[styles.cardsWrap, isGrid && styles.cardsWrapGrid]}>
            {filteredServices.map((service, index) =>
              renderCard(service, index)
            )}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COSMIC.bg,
  },

  // ── TOP NAV ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(91,31,115,0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(91,31,115,0.06)',
      },
      default: {
        shadowColor: '#5B1F73',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },

  // Back button — THE FIX
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: COSMIC.tint,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(91,31,115,0.15)',
  },
  backBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  backArrow: {
    fontSize: 26,
    fontWeight: '500',
    color: COSMIC.deep,
    lineHeight: 30,
    marginTop: -2,
    marginLeft: -1,
  },

  logoArea: {
    alignItems: 'center',
    gap: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoEmoji: { fontSize: 17 },
  logoText: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: COSMIC.deep,
    letterSpacing: -0.3,
  },
  logoTagline: {
    fontSize: 9,
    color: '#A066C0',
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },

  // ── SCROLL ──
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COSMIC.bg,
  },
  scrollView: {
    backgroundColor: COSMIC.bg,
  },

  // ── HERO ──
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroWrapWide: {
    paddingHorizontal: 22,
  },
  hero: {
    borderRadius: 22,
    padding: 22,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 130,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 20px rgba(43,18,76,0.28)',
      },
      default: {
        shadowColor: COSMIC.deep,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  heroWide: {
    paddingVertical: 34,
    paddingHorizontal: 30,
  },

  // Decorative elements
  orb1: {
    position: 'absolute',
    top: -20,
    right: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  orb2: {
    position: 'absolute',
    bottom: -30,
    right: 30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  starDot: {
    position: 'absolute',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  starLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroCrystalMobile: {
    position: 'absolute',
    right: 20,
    top: 16,
    fontSize: 50,
    opacity: 0.9,
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextBlock: { flex: 1, paddingRight: 16 },
  heroEmoji: { fontSize: 64, opacity: 0.9 },
  heroEyebrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroTitleWide: { fontSize: 34, marginBottom: 10 },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  // ── STATS ──
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 28,
    marginTop: -22,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    zIndex: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(91,31,115,0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 18px rgba(43,18,76,0.12)',
      },
      default: {
        shadowColor: COSMIC.deep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 6,
      },
    }),
  },
  statsStripWide: {
    marginTop: -26,
    paddingVertical: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COSMIC.deep,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  statDivider: {
    width: 0.5,
    backgroundColor: COSMIC.tint,
    marginVertical: 4,
  },

  // ── FILTER CHIPS ──
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 2,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipInactive: {
    backgroundColor: COSMIC.tint,
    borderWidth: 1,
    borderColor: 'rgba(91,31,115,0.15)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COSMIC.deep,
  },
  chipTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── SECTION HEADER ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  countPill: {
    backgroundColor: COSMIC.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(91,31,115,0.15)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: COSMIC.deep,
  },

  // ── CARDS ──
  cardsWrap: {
    paddingHorizontal: 16,
    gap: 10,
  },
  cardsWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  cardCell: {
    width: '100%',
  },
  cardCellGrid: {
    flexBasis: 'auto',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(91,31,115,0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0px 3px 10px rgba(91,31,115,0.08)',
      },
      default: {
        shadowColor: '#5B1F73',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  cardGrid: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    minHeight: 220,
  },
  cardHover: {
    transform: [{ translateY: -3 }],
    ...Platform.select({
      web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.18)' },
      default: { shadowOpacity: 0.18, shadowRadius: 16 },
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  // Left accent bar
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  accentBarGrid: {
    width: '100%',
    height: 4,
    alignSelf: 'auto',
  },

  // Badge
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Card content
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 13,
  },
  cardContentGrid: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    gap: 0,
    flex: 1,
  },

  // Icon
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxGrid: {
    width: 62,
    height: 62,
    borderRadius: 16,
    marginBottom: 14,
  },
  iconText: { fontSize: 26 },
  iconTextGrid: { fontSize: 30 },

  // Info
  info: { flex: 1 },
  infoGrid: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: COSMIC.vivid,
  },

  // Grid CTA button
  consultBtn: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  consultBtnPressable: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  consultBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Chevron for list mode
  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
    marginRight: 2,
    lineHeight: 28,
  },
});
