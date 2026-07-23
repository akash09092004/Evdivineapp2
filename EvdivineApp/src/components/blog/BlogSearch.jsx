import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "../../theme/colors";

export default function BlogSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Search title, category, tag or keyword",
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;

  return (
    <View style={[styles.shell, isMobile && styles.shellMobile]}>
      <View style={[styles.inputWrap, isMobile && styles.inputWrapMobile]}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor="rgba(78,37,19,0.50)"
          style={styles.input}
          returnKeyType="search"
          accessibilityLabel="Search blogs"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.button,
          isMobile && styles.buttonMobile,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  shellMobile: {
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    minWidth: 240,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.14)",
    ...Shadows.card,
  },
  inputWrapMobile: {
    minWidth: "100%",
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },
  button: {
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  buttonMobile: {
    width: "100%",
    minWidth: "100%",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});
