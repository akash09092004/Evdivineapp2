import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from "../LinearGradient";
import { Colors, Shadows } from "../../theme/colors";

export default function BlogHero({ label = "What We Offer", title = "Blog", subtitle }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <LinearGradient
      colors={[Colors.surfaceSoft, "#F9F0DA"]}
      style={[styles.shell, isCompact && styles.shellCompact]}
    >
      <View style={styles.overlayCircle} />
      <View style={styles.overlayCircle2} />

      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Ionicons name="diamond" size={14} color={Colors.primaryLight} />
          <View style={styles.divider} />
        </View>

        {subtitle ? <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>{subtitle}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 85,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    minHeight: 210,
    ...Shadows.lg,
    ...Platform.select({
      web: {
        backdropFilter: "blur(16px)",
      },
    }),
  },
  shellCompact: {
    marginHorizontal: 12,
    marginTop: 24,
    minHeight: 170,
  },
  overlayCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(163,75,31,0.08)",
    top: -40,
    right: -50,
  },
  overlayCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(233,166,77,0.12)",
    bottom: -30,
    left: -20,
  },
  content: {
    paddingHorizontal: 26,
    paddingTop: 48,
    paddingBottom: 24,
    gap: 10,
    justifyContent: "flex-start",
    minHeight: 210,
  },
  contentCompact: {
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 18,
    minHeight: 170,
  },
  label: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    fontFamily: "serif",
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 240,
  },
  divider: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(163,75,31,0.24)",
  },
  subtitle: {
    maxWidth: 620,
    color: "rgba(78,37,19,0.82)",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    marginTop: 4,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 22,
  },
});
