import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../theme/colors";
import BlogCard from "./BlogCard";

export default function RelatedBlogs({ blogs = [], onPressBlog }) {
  if (!blogs.length) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <Text style={styles.title}>Related Blogs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {blogs.slice(0, 4).map((blog) => (
          <BlogCard
            key={blog._id || blog.id || blog.slug}
            blog={blog}
            compact
            onPress={() => onPressBlog?.(blog)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  row: {
    gap: 14,
    paddingBottom: 6,
  },
});

