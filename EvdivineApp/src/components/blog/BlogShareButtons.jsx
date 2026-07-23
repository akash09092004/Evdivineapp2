import React from "react";
import { Alert, Linking, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

const shareTo = async (url, label) => {
  if (!url) {
    return;
  }

  const encoded = encodeURIComponent(url);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send/?phone=919876543210&text=${encoded}&type=phone_number&app_absent=0`,
    facebook:"https://www.facebook.com/people/Evdivine/61591671718130/?sk=directory_contact_info&fb_profile_edit_entry_point=%7B%22feature%22%3A%22profile_directory%22%2C%22click_point%22%3A%22pencil_edit_directory_section%22%2C%22additional_metadata%22%3A%7B%22section_type%22%3A%22contact_info%22%7D%7D",
    linkedin: "https://www.linkedin.com/company/evdivine/posts/?feedView=all",
  };

  if (label === "copy") {
    if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      Alert.alert("Copied", "Blog link copied to clipboard.");
      return;
    }

    await Share.share({ message: url });
    return;
  }

  if (Platform.OS === "web") {
    window.open(shareLinks[label], "_blank", "noopener,noreferrer");
    return;
  }

  await Linking.openURL(shareLinks[label]);
};

const ShareButton = ({ icon, label, onPress }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        isCompact && styles.btnCompact,
        pressed && styles.btnPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

export default function BlogShareButtons({ url }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <ShareButton icon="link-outline" label="Copy Link" onPress={() => shareTo(url, "copy")} />
      <ShareButton icon="logo-whatsapp" label="WhatsApp" onPress={() => shareTo(url, "whatsapp")} />
      <ShareButton icon="logo-facebook" label="Facebook" onPress={() => shareTo(url, "facebook")} />
      <ShareButton icon="logo-twitter" label="X" onPress={() => shareTo(url, "x")} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  rowCompact: {
    flexDirection: "column",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  btnCompact: {
    width: "100%",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
