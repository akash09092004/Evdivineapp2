import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function VideoCallSession({ navigation }) {
  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate("MainTabs", { screen: "Booking" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#07172D" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Video Call</Text>
          <Text style={styles.headerSub}>Your video consultation is ready</Text>
        </View>

        <View style={styles.badge}>
          <Ionicons name="videocam" size={16} color="#3B82F6" />
          <Text style={styles.badgeText}>HD</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.videoFrame}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={42} color="#fff" />
          </View>
          <Text style={styles.title}>Preparing your video room</Text>
          <Text style={styles.subtitle}>
            Camera and microphone access can be added here later. For now this screen
            confirms that the video call page is open.
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, styles.micBtn]}>
            <Ionicons name="mic" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.camBtn]}>
            <Ionicons name="videocam" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={() => navigation.goBack()}>
            <Ionicons name="call" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#07172D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#07172D",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    color: "#B3C7E6",
    fontSize: 12,
    marginTop: 3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: "#3B82F6",
    fontWeight: "800",
    fontSize: 12,
  },
  body: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  videoFrame: {
    flex: 1,
    backgroundColor: "#0F2340",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.22)",
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#C6D7F0",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 16,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    backgroundColor: "#334155",
  },
  camBtn: {
    backgroundColor: "#0EA5E9",
  },
  endBtn: {
    backgroundColor: "#EF4444",
  },
});
