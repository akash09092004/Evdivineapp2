import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Chat({ onSelect, navigation }) {
  const [selected, setSelected] = useState(false);
  const { width } = useWindowDimensions();

  const isSmall = width < 360;

  const handlePress = () => {
    const newValue = !selected;
    setSelected(newValue);
    onSelect && onSelect(newValue ? "chat" : null);

    if (newValue && navigation?.navigate) {
      navigation.navigate("ChatSession");
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
          name="chatbubble-ellipses-outline"
          size={isSmall ? 24 : 30}
          color={selected ? "#fff" : "#7C3AED"}
        />
      </View>

      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[styles.title, selected && styles.activeTitle]}
        >
          Chat
        </Text>

        <Text
          numberOfLines={2}
          style={[styles.subtitle, selected && styles.activeSubtitle]}
        >
          Text message consultation
        </Text>

        <Text style={[styles.price, selected && styles.activePrice]}>
          Rs. 499 / 30 min
        </Text>
      </View>

      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={isSmall ? 22 : 26}
        color={selected ? "#fff" : "#7C3AED"}
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
    borderColor: "#DDD6FE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  activeCard: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
    shadowOpacity: 0.28,
    elevation: 8,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#F5F3FF",
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
    color: "#EDE9FE",
  },
  price: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7C3AED",
    marginTop: 7,
  },
  activePrice: {
    color: "#FFFFFF",
  },
});
