import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const renderIcon = (item, focused) => {
  const color = focused ? '#A34B1F' : 'rgba(78,37,19,0.58)';

  if (item.isBrand) {
    return (
      <View style={[styles.bookingBrandWrap, focused && styles.bookingBrandWrapActive]}>
        <Text style={[styles.bookingBrandText, focused && styles.bookingBrandTextActive]}>B.</Text>
      </View>
    );
  }

  if (item.iconType === 'MaterialIcons') {
    return <MaterialIcons name={focused ? item.activeIcon : item.icon} size={24} color={color} />;
  }

  return <Ionicons name={focused ? item.activeIcon : item.icon} size={22} color={color} />;
};

export default function BottomNavbar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const barHeight = 60 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 6);

  return (
    <View
      style={[
        styles.bar,
        {
          height: barHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 6),
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const route = state.routes.find((routeItem) => routeItem.name === item.name);
        const focused = state.routes[state.index]?.name === item.name;

        if (!route) {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.dispatch({
              ...CommonActions.navigate({
                name: item.name,
                merge: true,
                params: item.name === 'Blog' ? DEFAULT_BLOG_PARAMS : undefined,
              }),
              target: state.key,
            });
          }
        };

        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={item.label}
            onPress={onPress}
            style={({ pressed }) => [
              styles.item,
              focused && styles.itemActive,
              pressed && styles.itemPressed,
            ]}
          >
            {renderIcon(item, focused)}
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(244,224,183,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(163,75,31,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 4,
    width: '100%',
    ...Shadows.lg,
    ...Platform.select({
      web: {
        boxShadow: '0px -6px 18px rgba(0,0,0,0.18)',
      },
    }),
  },
  item: {
    flex: 1,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 16,
    gap: 1,
  },
  itemActive: {
    backgroundColor: 'rgba(163,75,31,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(163,75,31,0.18)',
  },
  itemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(78,37,19,0.58)',
  },
  labelActive: {
    color: '#A34B1F',
  },
  bookingBrandWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(163,75,31,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(163,75,31,0.12)',
  },
  bookingBrandWrapActive: {
    backgroundColor: 'rgba(163,75,31,0.14)',
    borderColor: 'rgba(163,75,31,0.18)',
  },
  bookingBrandText: {
    color: 'rgba(78,37,19,0.82)',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  bookingBrandTextActive: {
    color: '#A34B1F',
  },
});
