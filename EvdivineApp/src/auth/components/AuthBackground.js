import React from "react";
import {
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

const AUTH_BG_VIDEO = require("../../../assets/video/199293-909903179.mp4");

export default function AuthBackground({ children }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.background}>
        <video
          style={styles.video}
          src={AUTH_BG_VIDEO?.uri || AUTH_BG_VIDEO?.default || AUTH_BG_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <View style={styles.overlay} />
        <View style={styles.tint} />
        {children}
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <Video
        source={AUTH_BG_VIDEO}
        style={styles.video}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
      />
      <View style={styles.overlay} />
      <View style={styles.tint} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    backgroundColor: "#0B0716",
    objectFit: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,4,26,0.22)",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(138,82,255,0.02)",
  },
});
