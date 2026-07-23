import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "../../theme/colors";

const SkeletonBlock = ({ style }) => {
  return <View style={[styles.block, style]} />;
};

export default function BlogSkeleton({ variant = "grid", count = 6 }) {
  if (variant === "detail") {
    return (
      <View style={styles.detailWrap}>
        <SkeletonBlock style={styles.detailImage} />
        <SkeletonBlock style={styles.detailTitle} />
        <SkeletonBlock style={styles.detailMeta} />
        <SkeletonBlock style={styles.detailPara} />
        <SkeletonBlock style={styles.detailPara} />
        <SkeletonBlock style={[styles.detailPara, { width: "80%" }]} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock style={styles.image} />
          <View style={styles.body}>
            <SkeletonBlock style={styles.lineSm} />
            <SkeletonBlock style={styles.lineLg} />
            <SkeletonBlock style={styles.lineMd} />
            <SkeletonBlock style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "rgba(163,75,31,0.12)",
    borderRadius: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.12)",
  },
  image: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 0,
  },
  body: {
    padding: 16,
    gap: 10,
  },
  lineSm: {
    width: "36%",
    height: 12,
  },
  lineLg: {
    width: "94%",
    height: 18,
  },
  lineMd: {
    width: "88%",
    height: 14,
  },
  lineShort: {
    width: "72%",
    height: 14,
  },
  detailWrap: {
    gap: 14,
  },
  detailImage: {
    width: "100%",
    aspectRatio: 1.8,
    borderRadius: 24,
  },
  detailTitle: {
    width: "70%",
    height: 24,
  },
  detailMeta: {
    width: "45%",
    height: 14,
  },
  detailPara: {
    width: "100%",
    height: 14,
  },
});
