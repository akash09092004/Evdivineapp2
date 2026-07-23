import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function VideoCall({ onSelect, navigation }) {
  const [selected, setSelected] = useState(false);
  const { width } = useWindowDimensions();

  const isSmall = width < 360;

  const handlePress = () => {
    const newValue = !selected;
    setSelected(newValue);
    onSelect && onSelect(newValue ? "video" : null);

    if (newValue && navigation?.navigate) {
      navigation.navigate("VideoCallSession");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[styles.card, selected && styles.activeCard]}
      onPress={handlePress}
    >
      <View style={[styles.iconBox, selected && styles.activeIconBox]}>
        <Ionicons
          name="videocam-outline"
          size={isSmall ? 24 : 30}
          color={selected ? "#fff" : "#10B981"}
        />
      </View>

      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[styles.title, selected && styles.activeTitle]}
        >
          Video Call
        </Text>

        <Text
          numberOfLines={2}
          style={[styles.subtitle, selected && styles.activeSubtitle]}
        >
          Face-to-face video consultation
        </Text>

        <Text style={[styles.price, selected && styles.activePrice]}>
          ₹999 / 30 min
        </Text>
      </View>

      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={isSmall ? 22 : 26}
        color={selected ? "#fff" : "#10B981"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1.5,
    borderColor: "#A7F3D0",

    shadowColor: "#10B981",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  activeCard: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowOpacity: 0.28,
    elevation: 8,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  activeIconBox: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  content: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2B124C",
  },

  activeTitle: {
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },

  activeSubtitle: {
    color: "#ECFDF5",
  },

  price: {
    fontSize: 14,
    fontWeight: "900",
    color: "#10B981",
    marginTop: 7,
  },

  activePrice: {
    color: "#FFFFFF",
  },
});
