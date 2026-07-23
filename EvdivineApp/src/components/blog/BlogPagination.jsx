import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";

const pageWindow = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const visible = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return visible;
};

export default function BlogPagination({
  currentPage = 1,
  totalPages = 1,
  hasNextPage,
  hasPrevPage,
  onChangePage,
}) {
  const pages = useMemo(() => pageWindow(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <Pressable
        accessibilityRole="button"
        disabled={!hasPrevPage}
        onPress={() => onChangePage?.(Math.max(1, currentPage - 1))}
        style={({ pressed }) => [
          styles.navBtn,
          (!hasPrevPage || pressed) && !hasPrevPage && styles.navBtnDisabled,
          pressed && hasPrevPage && styles.navBtnPressed,
        ]}
      >
        <Ionicons name="chevron-back" size={18} color={hasPrevPage ? Colors.text : "rgba(78,37,19,0.35)"} />
        <Text style={[styles.navText, !hasPrevPage && styles.navTextDisabled]}>Previous</Text>
      </Pressable>

      <View style={styles.pages}>
        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const showEllipsis = previousPage && page - previousPage > 1;

          return (
            <React.Fragment key={page}>
              {showEllipsis ? <Text style={styles.ellipsis}>...</Text> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => onChangePage?.(page)}
                style={({ pressed }) => [
                  styles.pageBtn,
                  page === currentPage && styles.pageBtnActive,
                  pressed && styles.pageBtnPressed,
                ]}
              >
                <Text style={[styles.pageText, page === currentPage && styles.pageTextActive]}>{page}</Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!hasNextPage}
        onPress={() => onChangePage?.(Math.min(totalPages, currentPage + 1))}
        style={({ pressed }) => [
          styles.navBtn,
          (!hasNextPage || pressed) && !hasNextPage && styles.navBtnDisabled,
          pressed && hasNextPage && styles.navBtnPressed,
        ]}
      >
        <Text style={[styles.navText, !hasNextPage && styles.navTextDisabled]}>Next</Text>
        <Ionicons name="chevron-forward" size={18} color={hasNextPage ? Colors.text : "rgba(78,37,19,0.35)"} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 10,
  },
  pages: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pageBtn: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  pageBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  pageText: {
    color: Colors.text,
    fontWeight: "800",
  },
  pageTextActive: {
    color: "#fff",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.16)",
  },
  navBtnDisabled: {
    opacity: 0.55,
  },
  navBtnPressed: {
    opacity: 0.92,
  },
  navText: {
    color: Colors.text,
    fontWeight: "800",
  },
  navTextDisabled: {
    color: "rgba(78,37,19,0.35)",
  },
  ellipsis: {
    color: Colors.textMuted,
    fontWeight: "800",
  },
});

