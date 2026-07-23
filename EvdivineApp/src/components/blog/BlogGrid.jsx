import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

export default function BlogGrid({ children }) {
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const itemWidth = columns === 1 ? "100%" : columns === 2 ? "48%" : "31.5%";

  return (
    <View style={styles.grid}>
      {React.Children.map(children, (child) => (
        <View style={[styles.item, { width: itemWidth }]}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  item: {
    minWidth: 0,
  },
});
