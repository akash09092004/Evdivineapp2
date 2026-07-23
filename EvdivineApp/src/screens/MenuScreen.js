import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from '../components/LinearGradient';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { Colors, Shadows } from '../theme/colors';

const DEFAULT_BLOG_PARAMS = {
  page: 1,
  limit: 9,
  search: '',
  category: '',
  tags: '',
  featured: false,
  trending: false,
  sort: 'latest',
};

const menuItems = [
  { label: 'Home', icon: 'home-outline', screen: 'Home', tab: true },
  { label: 'About', icon: 'information-circle-outline', screen: 'About', tab: true },
  { label: 'Services', icon: 'grid-outline', screen: 'Services', tab: true },
  { label: 'Booking', icon: 'calendar-outline', screen: 'Booking', tab: true },
  { label: 'Blog', icon: 'reader-outline', screen: 'Blog', tab: true },
  { label: 'Profile', icon: 'person-outline', screen: 'Profile', tab: true },
];

export default function MenuScreen({ navigation }) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const openScreen = (item) => {
    if (item.tab) {
      navigation.navigate('MainTabs', {
        screen: item.screen,
        params: item.screen === 'Blog' ? DEFAULT_BLOG_PARAMS : undefined,
      });
      return;
    }
    navigation.navigate(item.screen);
  };

  const closeMenu = () => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        navigation.goBack();
      }
    });
  };

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 340],
  });
  const backdropOpacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0],
  });

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

        <View style={styles.backdropWrap}>
          <Pressable style={styles.backdropPressable} onPress={closeMenu}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </Pressable>

          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.kicker}>Quick Menu</Text>
                  <Text style={styles.title}>Choose a page</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  onPress={closeMenu}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.sub}>
                Jump directly to the section you want to open.
              </Text>
            </LinearGradient>

            <View style={styles.list}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  onPress={() => {
                    closeMenu();
                    openScreen(item);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  backdropWrap: {
    flex: 1,
    position: 'relative',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '82%',
    maxWidth: 340,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    ...Shadows.lg,
  },
  hero: {
    margin: 16,
    borderRadius: 22,
    padding: 20,
    ...Shadows.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'serif',
  },
  sub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.86)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gradientSoftStart,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
