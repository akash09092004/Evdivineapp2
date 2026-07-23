import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../config/api";
import { Colors } from "../../theme/colors";

const resolveCategoryImage = (category) => {
  const raw =
    category?.imageUrl ||
    category?.image?.url ||
    category?.thumbnailUrl ||
    category?.thumb ||
    "";

  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
    return raw;
  }

  return raw.startsWith("/")
    ? `${API_BASE_URL}${raw}`
    : `${API_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

const FilterPill = ({ item, label, active, onPress, compact = false }) => {
  const imageUrl = resolveCategoryImage(item);

  return (
  <Pressable
    accessibilityRole="button"
    accessibilityState={active ? { selected: true } : {}}
    onPress={onPress}
    style={({ pressed }) => [
      styles.pill,
      compact && styles.pillCompact,
      active && styles.pillActive,
      pressed && styles.pillPressed,
    ]}
  >
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.pillImage} /> : null}
      <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
        {label}
      </Text>
  </Pressable>
  );
};

export default function BlogFilters({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  sort = "latest",
  onSortChange,
  featured = false,
  trending = false,
  onToggleFeatured,
  onToggleTrending,
}) {
  return (
    <View style={styles.shell}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {categories.map((item) => (
          <FilterPill
            key={item.key}
            item={item}
            label={item.label}
            active={selectedCategory === item.key}
            onPress={() => onSelectCategory?.(item.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.secondaryRow}>
        <FilterPill
          label="Featured"
          active={featured}
          onPress={onToggleFeatured}
          compact
        />
        <FilterPill
          label="Trending"
          active={trending}
          onPress={onToggleTrending}
          compact
        />
        <FilterPill
          label="Latest"
          active={sort === "latest"}
          onPress={() => onSortChange?.("latest")}
          compact
        />
        <FilterPill
          label="Oldest"
          active={sort === "oldest"}
          onPress={() => onSortChange?.("oldest")}
          compact
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 12,
  },
  row: {
    gap: 10,
    paddingVertical: 2,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  pillCompact: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(163,75,31,0.08)",
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  pillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  pillText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  pillTextActive: {
    color: "#fff",
  },
});
