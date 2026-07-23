import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../theme/colors";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "E";

export default function BlogAuthor({ author, compact = false, showMeta = false }) {
  const name = author?.name || "Evdivine";
  const avatar = author?.avatar?.url || author?.avatar;
  const initials = getInitials(name);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.avatarWrap, compact && styles.avatarWrapCompact]}>
        {avatar && !avatarError ? (
          <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" onError={() => setAvatarError(true)} />
        ) : (
          <Text style={[styles.initials, compact && styles.initialsCompact]}>{initials}</Text>
        )}
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={1} style={[styles.name, compact && styles.nameCompact]}>
          {name}
        </Text>
        {showMeta ? (
          <Text numberOfLines={1} style={[styles.subtitle, compact && styles.subtitleCompact]}>
            {author?.role || "Spiritual guide"}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowCompact: {
    gap: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  avatarWrapCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  initialsCompact: {
    fontSize: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  nameCompact: {
    fontSize: 13,
  },
  subtitle: {
    marginTop: 2,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  subtitleCompact: {
    fontSize: 11,
  },
});
