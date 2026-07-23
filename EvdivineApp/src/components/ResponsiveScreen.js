import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResponsiveScreen({ children, backgroundColor }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 900;
  const shellStyle = [
    styles.shell,
    isWide && styles.shellWide,
    Platform.OS === 'web' && styles.shellWeb,
    Platform.OS === 'android' && {
      paddingTop: Math.max(insets.top, 12),
      paddingBottom: Math.max(insets.bottom, 0),
    },
  ];

  return (
    <View style={[styles.outer, backgroundColor && { backgroundColor }]}>
      <View style={shellStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  shellWide: {
    maxWidth: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 20px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  shellWeb: {
    maxWidth: 1240,
  },
});
