import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BookingHeader({
  title = "Tarot Reading",
  subtitle = "Choose your time slot and consultation type",
  price = "$50",
  duration = "30 min",
  image,
  onBack,
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-outline" size={22} color="#2B124C" />
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.imageBox}>
          {image ? (
            <Image source={image} style={styles.image} />
          ) : (
            <Ionicons name="sparkles-outline" size={42} color="#fff" />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={15} color="#7C3AED" />
              <Text style={styles.badgeText}>{duration}</Text>
            </View>

            <View style={styles.priceBadge}>
              <Text style={styles.price}>{price}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 5,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F5F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageBox: {
    width: 92,
    height: 92,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2B124C",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: "#F5F0FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    color: "#7C3AED",
    fontWeight: "800",
    fontSize: 12,
  },
  priceBadge: {
    backgroundColor: "#2B124C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  price: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
});