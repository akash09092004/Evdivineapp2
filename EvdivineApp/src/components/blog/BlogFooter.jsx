import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../../theme/colors";

const FooterColumn = ({ title, items = [], onPressItem }) => (
  <View style={styles.col}>
    <Text style={styles.colTitle}>{title}</Text>
    <View style={styles.linkList}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          onPress={() => onPressItem?.(item.route)}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
        >
          <Text style={styles.linkText}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export default function BlogFooter({ onNavigate }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 700;

  const quickLinks = [
    { label: "Home", route: "Home" },
    { label: "About", route: "About" },
    { label: "Services", route: "Services" },
    { label: "Blog", route: "Blog" },
    { label: "Contact", route: "contactus" },
  ];

  const serviceLinks = [
    { label: "Tarot Reading", route: "TarotReading" },
    { label: "Astrology", route: "AstrologyConsultation" },
    { label: "Numerology", route: "Numerology" },
    { label: "Vastu Consultation", route: "VastuConsultation" },
  ];

  return (
    <View style={[styles.shell, isCompact && styles.shellCompact]}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.brand}>Evdivine</Text>
          <Text style={styles.tag}>Ancient Wisdom</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Explore spiritual guidance, astrology insights, and practical wisdom designed for
        modern life.
      </Text>

      <View style={[styles.grid, isCompact && styles.gridCompact]}>
        <FooterColumn title="Quick Links" items={quickLinks} onPressItem={onNavigate} />
        <FooterColumn title="Services" items={serviceLinks} onPressItem={onNavigate} />

        <View style={styles.col}>
          <Text style={styles.colTitle}>Contact</Text>
          <Text style={styles.contact}>123 Divine Street, New Delhi</Text>
          <Text style={styles.contact}>support@evdivine.com</Text>
          <Text style={styles.contact}>+91 98765 43210</Text>
        </View>
      </View>

      <View style={[styles.bottomRow, isCompact && styles.bottomRowCompact]}>
        <Text style={styles.copy}>(c) 2025 Evdivine. All Rights Reserved.</Text>
        <Text style={styles.copy}>Privacy Policy | Terms & Conditions</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 22,
    borderRadius: 26,
    backgroundColor: "#F2D8A8",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
    ...Shadows.lg,
  },
  shellCompact: {
    marginHorizontal: 12,
    padding: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  brand: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  tag: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  description: {
    marginTop: 14,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 720,
  },
  grid: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  gridCompact: {
    gap: 14,
  },
  col: {
    flexGrow: 1,
    flexBasis: 220,
    gap: 10,
  },
  colTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  linkList: {
    gap: 8,
  },
  linkBtn: {
    alignSelf: "flex-start",
  },
  linkBtnPressed: {
    opacity: 0.85,
  },
  linkText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  contact: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(163,75,31,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  bottomRowCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  copy: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
});
