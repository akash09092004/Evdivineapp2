import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ResponsiveScreen from '../components/ResponsiveScreen';
import LinearGradient from '../components/LinearGradient';
import { Colors, Shadows } from '../theme/colors';

export default function ServicePage({ navigation, title, subtitle, emoji, description, bookLabel = 'Book Now' }) {
  const insets = useSafeAreaInsets();

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 + insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.hero}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.body}>{description}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What You Get</Text>
            <Text style={styles.body}>
              A clean service detail page with booking access, ready for future API, pricing,
              and slot selection work.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Booking', { service: title })}
          >
            <Text style={styles.ctaText}>{bookLabel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 28 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 14 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  hero: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    ...Shadows.lg,
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    ...Shadows.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 20, color: Colors.textMuted },
  cta: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.card,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
