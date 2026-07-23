import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from './LinearGradient';
import { Colors, Shadows } from '../theme/colors';
import { NAV_ITEMS } from '../navigation/navItems';

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

const Logo = () => (
  <View style={styles.logoBox}>
    <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
  </View>
);

const DesktopNavLink = ({ item, focused, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={focused ? { selected: true } : {}}
    onPress={onPress}
    style={({ pressed }) => [
      styles.desktopLink,
      focused && styles.desktopLinkActive,
      pressed && styles.desktopLinkPressed,
    ]}
    hitSlop={8}
  >
    <Text style={[styles.desktopLinkText, focused && styles.desktopLinkTextActive]}>
      {item.label}
    </Text>
  </Pressable>
);

function DesktopNavbar({ navigation, activeRouteName, onNotification, onMenu }) {
  return (
    <View style={styles.desktopShell}>
      <View style={styles.desktopBar}>
        <View style={styles.desktopLeft}>
          <Logo />
          <View>
            <Text style={styles.brand}>Evdivine</Text>
            <Text style={styles.tag}>LIFT YOUR LIFE</Text>
          </View>
        </View>

        <View style={styles.desktopLinks}>
          {NAV_ITEMS.map((item) => (
            <DesktopNavLink
              key={item.name}
              item={item}
              focused={activeRouteName === item.name}
              onPress={() =>
                navigation.navigate(
                  item.name,
                  item.name === 'Blog' ? DEFAULT_BLOG_PARAMS : undefined
                )
              }
            />
          ))}
        </View>

        <View style={styles.desktopActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={onNotification}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            hitSlop={10}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={onMenu}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            hitSlop={10}
          >
            <Ionicons name="menu" size={24} color={Colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MobileHeader({
  title,
  subtitle,
  onBack,
  onRight,
  showBack = true,
  showRight = true,
  leftIcon = 'arrow-back',
  rightIcon = 'ellipsis-vertical',
  rightLabel,
  variant = 'brand',
  containerStyle,
  titleStyle,
  subtitleStyle,
  leftIconColor,
  rightIconColor,
  compact = false,
}) {
  const insets = useSafeAreaInsets();
  const isBrand = variant !== 'light';
  const resolvedLeftIconColor = leftIconColor || (isBrand ? '#fff' : Colors.primary);
  const resolvedRightIconColor = rightIconColor || (isBrand ? '#fff' : Colors.primary);

  const bar = (
    <View
      style={[
        styles.mobileBar,
        compact && styles.mobileBarCompact,
        isBrand ? styles.mobileBrandBar : styles.mobileLightBar,
        { paddingTop: 14 + insets.top * 0.15 },
        containerStyle,
      ]}
    >
      <View style={styles.sideSlot}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              compact && styles.iconButtonCompact,
              isBrand ? styles.brandIconButton : styles.lightIconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={10}
          >
            <Ionicons name={leftIcon} size={compact ? 20 : 22} color={resolvedLeftIconColor} />
          </Pressable>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}
      </View>

      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={[
          styles.title,
          compact && styles.titleCompact,
          isBrand ? styles.brandTitle : styles.lightTitle,
          titleStyle
        ]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              compact && styles.subtitleCompact,
              isBrand ? styles.brandSubtitle : styles.lightSubtitle,
              subtitleStyle
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.sideSlot, styles.sideRight]}>
        {showRight ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRight}
            style={({ pressed }) => [
              styles.iconButton,
              compact && styles.iconButtonCompact,
              isBrand ? styles.brandIconButton : styles.lightIconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={10}
          >
            {rightLabel ? (
              <Text style={[styles.rightLabel, { color: resolvedRightIconColor }]}>{rightLabel}</Text>
            ) : (
              <Ionicons name={rightIcon} size={compact ? 18 : 20} color={resolvedRightIconColor} />
            )}
          </Pressable>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}
      </View>
    </View>
  );

  if (isBrand) {
    return (
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.brandShell}>
        {bar}
      </LinearGradient>
    );
  }

  return bar;
}

export default function TopNavbar(props) {
  const { width } = useWindowDimensions();
  const isDesktop = props.mode === 'desktop' || width >= 768;
  const isCompactMobile = width <= 390;

  if (isDesktop) {
    return (
      <DesktopNavbar
        navigation={props.navigation}
        activeRouteName={props.activeRouteName}
        onNotification={props.onNotification}
        onMenu={props.onMenu}
      />
    );
  }

  return (
    <MobileHeader
      title={props.title}
      subtitle={props.subtitle}
      onBack={props.onBack}
      onRight={props.onRight}
      showBack={props.showBack}
      showRight={props.showRight}
      leftIcon={props.leftIcon}
      rightIcon={props.rightIcon}
      rightLabel={props.rightLabel}
      variant={props.variant}
      containerStyle={props.containerStyle}
      titleStyle={props.titleStyle}
      subtitleStyle={props.subtitleStyle}
      leftIconColor={props.leftIconColor}
      rightIconColor={props.rightIconColor}
      compact={isCompactMobile}
    />
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  desktopBar: {
    minHeight: 84,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: 18,
    backgroundColor: 'rgba(244,224,183,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163,75,31,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
    }),
    ...Shadows.lg,
  },
  desktopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
  },
  desktopLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  desktopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 112,
    justifyContent: 'flex-end',
  },
  desktopLink: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  desktopLinkActive: {
    backgroundColor: 'rgba(163,75,31,0.10)',
    borderColor: 'rgba(163,75,31,0.18)',
  },
  desktopLinkPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  desktopLinkText: {
    color: 'rgba(78,37,19,0.74)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  desktopLinkTextActive: {
    color: '#A34B1F',
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(163,75,31,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163,75,31,0.08)',
  },
  brandShell: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  mobileBar: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileBarCompact: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  mobileBrandBar: {
    backgroundColor: 'rgba(244,224,183,0.98)',
  },
  mobileLightBar: {
    backgroundColor: 'rgba(244,224,183,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(163,75,31,0.14)',
  },
  sideSlot: {
    width: 54,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  sidePlaceholder: {
    width: 40,
    height: 40,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 16,
  },
  brandTitle: {
    color: '#A34B1F',
  },
  lightTitle: {
    color: '#4E2513',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 10,
  },
  brandSubtitle: {
    color: 'rgba(78,37,19,0.58)',
  },
  lightSubtitle: {
    color: '#8B5F49',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandIconButton: {
    backgroundColor: 'rgba(163,75,31,0.10)',
  },
  lightIconButton: {
    backgroundColor: 'rgba(163,75,31,0.10)',
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163,75,31,0.18)',
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  brand: {
    color: '#A34B1F',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  tag: {
    color: '#8B5F49',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
});
