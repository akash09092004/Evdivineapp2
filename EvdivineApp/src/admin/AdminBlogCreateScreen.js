import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";
import { getApiErrorMessage } from "../utils/apiError";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  status: "published",
  scheduledAt: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  canonicalUrl: "",
  ogImage: "",
  featuredImageAltText: "",
  isFeatured: false,
  isTrending: false,
};

const asString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const isValidHttpUrl = (value) => {
  const raw = asString(value);
  if (!raw) return true;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AdminBlogCreateScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const previewRef = useRef("");

  const getToken = async () => AsyncStorage.getItem("adminToken");

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    previewRef.current = imagePreview;
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (previewRef.current && Platform.OS === "web" && typeof URL !== "undefined") {
        try {
          URL.revokeObjectURL(previewRef.current);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const loadCategories = async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/blog-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Unable to load categories"));
    }

    const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    setCategories(rows);
    return rows;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await loadCategories();
        if (!form.category && rows[0]?._id) {
          setField("category", rows[0]._id);
        }
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load categories");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickImageFile = async () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      Alert.alert(
        "Image Upload",
        "Native file picker abhi configure nahi hai. Web browser me file upload karo."
      );
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (imagePreview && typeof URL !== "undefined") {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch {
          // ignore cleanup errors
        }
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      if (!form.featuredImageAltText) {
        setField("featuredImageAltText", form.title || file.name || "Blog featured image");
      }
    };
    input.click();
  };

  const clearImage = () => {
    if (imagePreview && typeof URL !== "undefined") {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {
        // ignore cleanup errors
      }
    }
    setImageFile(null);
    setImagePreview("");
  };

  const submit = async (targetStatus = form.status) => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const status = String(targetStatus || "draft").trim().toLowerCase();
    const title = asString(form.title);
    const excerpt = asString(form.excerpt);
    const content = asString(form.content);
    const category = asString(form.category);
    const metaTitle = asString(form.metaTitle).slice(0, 70);
    const metaDescription = asString(form.metaDescription).slice(0, 160);
    const canonicalUrl = asString(form.canonicalUrl);
    const scheduledAt = asString(form.scheduledAt);

    if (!title) return Alert.alert("Validation", "Title is required");
    if (!excerpt) return Alert.alert("Validation", "Excerpt is required");
    if (!content) return Alert.alert("Validation", "Content is required");
    if (!category) return Alert.alert("Validation", "Category is required");
    if (!isValidHttpUrl(canonicalUrl)) {
      return Alert.alert("Validation", "Canonical URL must start with http:// or https://");
    }

    if (status === "scheduled") {
      const scheduledDate = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(scheduledDate.getTime())) {
        return Alert.alert("Validation", "Scheduled At is required for scheduled posts");
      }
      if (scheduledDate.getTime() <= Date.now()) {
        return Alert.alert("Validation", "Scheduled At must be a future date/time");
      }
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", asString(form.slug));
      formData.append("excerpt", excerpt);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("status", status);
      if (metaTitle) formData.append("metaTitle", metaTitle);
      if (metaDescription) formData.append("metaDescription", metaDescription);
      if (asString(form.keywords)) formData.append("keywords", asString(form.keywords));
      if (canonicalUrl) formData.append("canonicalUrl", canonicalUrl);
      if (asString(form.ogImage)) formData.append("ogImage", asString(form.ogImage));
      if (asString(form.featuredImageAltText)) {
        formData.append("featuredImageAltText", asString(form.featuredImageAltText));
      }
      formData.append("isFeatured", String(Boolean(form.isFeatured)));
      formData.append("isTrending", String(Boolean(form.isTrending)));

      if (status === "scheduled" && scheduledAt) {
        formData.append("scheduledAt", new Date(scheduledAt).toISOString());
      }

      if (imageFile) {
        formData.append(
          "featuredImage",
          imageFile,
          imageFile.name || `blog-${Date.now()}.jpg`
        );
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/blogs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("[AdminBlogCreate] create failed", {
          status: response.status,
          payload,
        });
        throw new Error(
          getApiErrorMessage(payload, `Unable to create blog (${response.status})`)
        );
      }

      Alert.alert("Success", "Blog created successfully");
      setForm(emptyForm);
      clearImage();
      const rows = await loadCategories();
      setField("category", rows[0]?._id || "");
    } catch (error) {
      console.error("[AdminBlogCreate] submit error", error);
      Alert.alert("Error", error?.message || "Unable to create blog");
    } finally {
      setSaving(false);
    }
  };

  const statusChips = useMemo(() => ["draft", "published", "scheduled", "archived"], []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading blog editor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add New Blog</Text>
          <Text style={styles.subtitle}>Create post with actual image upload and SEO fields</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.label}>Blog Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Blog title"
            placeholderTextColor="#9C8FB9"
            value={form.title}
            onChangeText={(value) => setField("title", value)}
          />

          <Text style={styles.label}>Slug</Text>
          <TextInput
            style={styles.input}
            placeholder="blog-slug"
            placeholderTextColor="#9C8FB9"
            value={form.slug}
            onChangeText={(value) => setField("slug", value)}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {categories.map((item) => {
              const id = String(item?._id || item?.id || "");
              const active = form.category === id;
              return (
                <Pressable
                  key={id || item?.slug || item?.name}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setField("category", id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item?.name || item?.label || "Category"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Short Description / Excerpt</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Short description"
            placeholderTextColor="#9C8FB9"
            multiline
            numberOfLines={4}
            value={form.excerpt}
            onChangeText={(value) => setField("excerpt", value)}
          />

          <Text style={styles.label}>Content</Text>
          <TextInput
            style={[styles.input, styles.textAreaTall]}
            placeholder="Blog content"
            placeholderTextColor="#9C8FB9"
            multiline
            numberOfLines={10}
            value={form.content}
            onChangeText={(value) => setField("content", value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Featured Image</Text>
          <Text style={styles.helper}>
            Yahan actual image file backend ko bheji jaati hai. Preview sirf browser ke liye hai.
          </Text>

          <Pressable style={styles.fileBtn} onPress={pickImageFile}>
            <Ionicons name="image-outline" size={18} color="#fff" />
            <Text style={styles.fileBtnText}>{imageFile ? "Replace image" : "Upload image"}</Text>
          </Pressable>

          {imagePreview ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imagePreview }} style={styles.preview} />
              <Pressable style={styles.removeImageBtn} onPress={clearImage}>
                <Ionicons name="close-circle-outline" size={16} color="#fff" />
                <Text style={styles.removeImageText}>Remove image</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.label}>Featured Image Alt Text</Text>
          <TextInput
            style={styles.input}
            placeholder="Alt text"
            placeholderTextColor="#9C8FB9"
            value={form.featuredImageAltText}
            onChangeText={(value) => setField("featuredImageAltText", value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Publishing</Text>
          <Text style={styles.label}>Status</Text>
          <View style={styles.chipsRow}>
            {statusChips.map((status) => {
              const active = form.status === status;
              return (
                <Pressable
                  key={status}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setField("status", status)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {form.status === "scheduled" ? (
            <>
              <Text style={styles.label}>Scheduled At</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DDTHH:mm"
                placeholderTextColor="#9C8FB9"
                value={toInputDateTime(form.scheduledAt)}
                onChangeText={(value) => setField("scheduledAt", value)}
              />
            </>
          ) : null}

          <View style={styles.switchRow}>
            <Pressable style={styles.switchPill} onPress={() => setField("isFeatured", !form.isFeatured)}>
              <Text style={styles.switchText}>Featured</Text>
              <View style={[styles.toggle, form.isFeatured && styles.toggleActive]}>
                <View style={[styles.toggleKnob, form.isFeatured && styles.toggleKnobActive]} />
              </View>
            </Pressable>

            <Pressable style={styles.switchPill} onPress={() => setField("isTrending", !form.isTrending)}>
              <Text style={styles.switchText}>Trending</Text>
              <View style={[styles.toggle, form.isTrending && styles.toggleActive]}>
                <View style={[styles.toggleKnob, form.isTrending && styles.toggleKnobActive]} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>SEO</Text>
          <Text style={styles.label}>Meta Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Meta title"
            placeholderTextColor="#9C8FB9"
            value={form.metaTitle}
            onChangeText={(value) => setField("metaTitle", value)}
          />

          <Text style={styles.label}>Meta Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Meta description"
            placeholderTextColor="#9C8FB9"
            multiline
            numberOfLines={3}
            value={form.metaDescription}
            onChangeText={(value) => setField("metaDescription", value)}
          />

          <Text style={styles.label}>SEO Keywords</Text>
          <TextInput
            style={styles.input}
            placeholder="keyword1, keyword2"
            placeholderTextColor="#9C8FB9"
            value={form.keywords}
            onChangeText={(value) => setField("keywords", value)}
          />

          <Text style={styles.label}>Canonical URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/blog"
            placeholderTextColor="#9C8FB9"
            value={form.canonicalUrl}
            onChangeText={(value) => setField("canonicalUrl", value)}
          />

          <Text style={styles.label}>OG Image</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#9C8FB9"
            value={form.ogImage}
            onChangeText={(value) => setField("ogImage", value)}
          />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtnDark} onPress={() => submit("draft")} disabled={saving}>
            <Text style={styles.secondaryBtnText}>{saving ? "Saving..." : "Save Draft"}</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => submit("published")} disabled={saving}>
            <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Publish Now"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#120731",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#fff",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "#D8CFF3",
    fontSize: 13,
    marginTop: 3,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  helper: {
    color: "#D8CFF3",
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#1A0B3D",
    color: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  textAreaTall: {
    minHeight: 180,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  chipText: {
    color: "#D8CFF3",
    fontWeight: "800",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#fff",
  },
  fileBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  fileBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  previewWrap: {
    gap: 8,
  },
  preview: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    backgroundColor: "#1A0B3D",
  },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  removeImageText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  switchRow: {
    flexDirection: "row",
    gap: 12,
  },
  switchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  switchText: {
    color: "#fff",
    fontWeight: "800",
  },
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#16A34A",
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryBtnDark: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C2D12",
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  primaryBtnText: {
    color: "#1A1205",
    fontWeight: "900",
  },
});
