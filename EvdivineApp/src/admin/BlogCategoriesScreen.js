import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  name: "",
  description: "",
  isActive: true,
  imageAltText: "",
};

const asString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeImage = (category) => {
  const image = category?.image;
  return (
    image?.url ||
    category?.imageUrl ||
    image?.imageUrl ||
    image?.src ||
    image?.secure_url ||
    ""
  );
};

export default function BlogCategoriesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const previewRef = useRef("");

  const getToken = useCallback(() => AsyncStorage.getItem("adminToken"), []);

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

  const clearForm = useCallback(() => {
    if (imagePreview && Platform.OS === "web" && typeof URL !== "undefined") {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {
        // ignore cleanup errors
      }
    }

    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  }, [imagePreview]);

  const loadCategories = useCallback(async () => {
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
  }, [getToken, navigation]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadCategories();
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load categories");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCategories]);

  const pickImageFile = useCallback(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      Alert.alert(
        "Image Upload",
        "Native file picker is not wired here yet. Web browser me image upload karo."
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
      setImagePreview(URL.createObjectURL(file));
      if (!asString(form.imageAltText)) {
        setField("imageAltText", form.name || file.name || "Category image");
      }
    };
    input.click();
  }, [form.imageAltText, form.name, imagePreview]);

  const startEdit = useCallback(
    (item) => {
      if (!item) return;
      if (imagePreview && typeof URL !== "undefined") {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch {
          // ignore cleanup errors
        }
      }

      setEditingId(item._id);
      setForm({
        name: item.name || "",
        description: item.description || "",
        isActive: item.isActive !== false,
        imageAltText: item.image?.altText || item.name || "",
      });
      setImageFile(null);
      setImagePreview(normalizeImage(item) || "");
    },
    [imagePreview]
  );

  const submit = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const name = asString(form.name);
    if (!name) {
      Alert.alert("Validation", "Category name is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (asString(form.description)) formData.append("description", asString(form.description));
      formData.append("isActive", String(Boolean(form.isActive)));
      if (asString(form.imageAltText)) {
        formData.append("imageAltText", asString(form.imageAltText));
      }
      if (imageFile) {
        formData.append("image", imageFile, imageFile.name || `category-${Date.now()}.jpg`);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/blog-categories${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("[BlogCategories] save failed", { status: response.status, payload });
        throw new Error(getApiErrorMessage(payload, `Unable to save category (${response.status})`));
      }

      clearForm();
      await loadCategories();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to save category");
    } finally {
      setSaving(false);
    }
  }, [clearForm, editingId, form.description, form.imageAltText, form.isActive, form.name, getToken, imageFile, loadCategories, navigation]);

  const handleDelete = useCallback(
    async (item) => {
      const token = await getToken();
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      Alert.alert("Delete Category", `Delete "${item.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/admin/blog-categories/${item._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const payload = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(getApiErrorMessage(payload, `Unable to delete category (${response.status})`));
              }
              if (editingId === item._id) {
                clearForm();
              }
              await loadCategories();
            } catch (error) {
              Alert.alert("Error", error?.message || "Unable to delete category");
            }
          },
        },
      ]);
    },
    [clearForm, editingId, getToken, loadCategories, navigation]
  );

  const toggleStatus = useCallback(
    async (item) => {
      const token = await getToken();
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/blog-categories/${item._id}/status`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !item.isActive }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(payload, `Unable to update category (${response.status})`));
        }
        await loadCategories();
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to update category");
      }
    },
    [getToken, loadCategories, navigation]
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadCategories();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [loadCategories]);

  const headerLabel = useMemo(() => (editingId ? "Edit Category" : "Add Category"), [editingId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading categories...</Text>
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
          <Text style={styles.title}>Blog Categories</Text>
          <Text style={styles.subtitle}>Manage category images, active status, and deletion safely</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{headerLabel}</Text>
          <Text style={styles.helper}>Image yahan actual file se upload hoti hai. Preview sirf browser ke liye hai.</Text>

          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Category name"
            placeholderTextColor="#9C8FB9"
            value={form.name}
            onChangeText={(value) => setField("name", value)}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Category description"
            placeholderTextColor="#9C8FB9"
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(value) => setField("description", value)}
          />

          <Text style={styles.label}>Category Image</Text>
          <Pressable style={styles.fileBtn} onPress={pickImageFile}>
            <Ionicons name="image-outline" size={18} color="#fff" />
            <Text style={styles.fileBtnText}>{imageFile ? "Replace image" : "Upload image"}</Text>
          </Pressable>

          {imagePreview ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imagePreview }} style={styles.preview} resizeMode="cover" />
              <Pressable
                style={styles.removeBtn}
                onPress={() => {
                  if (imagePreview && Platform.OS === "web" && typeof URL !== "undefined") {
                    try {
                      URL.revokeObjectURL(imagePreview);
                    } catch {
                      // ignore cleanup errors
                    }
                  }
                  setImageFile(null);
                  setImagePreview("");
                }}
              >
                <Ionicons name="close-circle-outline" size={16} color="#fff" />
                <Text style={styles.removeBtnText}>Remove image</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.label}>Image Alt Text</Text>
          <TextInput
            style={styles.input}
            placeholder="Alt text"
            placeholderTextColor="#9C8FB9"
            value={form.imageAltText}
            onChangeText={(value) => setField("imageAltText", value)}
          />

          <Pressable style={styles.switchRow} onPress={() => setField("isActive", !form.isActive)}>
            <View>
              <Text style={styles.switchText}>Active</Text>
              <Text style={styles.switchSub}>Inactive category frontend me hide rahegi</Text>
            </View>
            <View style={[styles.toggle, form.isActive && styles.toggleActive]}>
              <View style={[styles.toggleKnob, form.isActive && styles.toggleKnobActive]} />
            </View>
          </Pressable>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryBtn} onPress={clearForm} disabled={saving}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={submit} disabled={saving}>
              <Text style={styles.primaryBtnText}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Categories</Text>
          <Pressable style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.refreshText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No categories found</Text>
          }
          renderItem={({ item }) => {
            const imageUrl = normalizeImage(item);
            return (
              <View style={styles.rowCard}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Ionicons name="image-outline" size={24} color="#7C3AED" />
                  </View>
                )}

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowDesc} numberOfLines={2}>
                    {item.description || "No description"}
                  </Text>
                  <Text style={styles.rowMeta}>{item.isActive ? "Active" : "Hidden"}</Text>
                </View>

                <View style={styles.rowActions}>
                  <Pressable style={styles.iconBtn} onPress={() => startEdit(item)}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                  </Pressable>
                  <Pressable style={[styles.iconBtn, styles.iconBtnAlt]} onPress={() => toggleStatus(item)}>
                    <Ionicons name={item.isActive ? "pause" : "play"} size={18} color="#fff" />
                  </Pressable>
                  <Pressable style={[styles.iconBtn, styles.dangerBtn]} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 28,
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
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 4,
  },
  switchText: {
    color: "#fff",
    fontWeight: "800",
  },
  switchSub: {
    color: "#D8CFF3",
    fontSize: 11,
    marginTop: 2,
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "800",
  },
  emptyText: {
    color: "#D8CFF3",
    textAlign: "center",
    marginTop: 12,
  },
  rowCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#1A0B3D",
  },
  thumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5EAFF",
  },
  rowTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  rowDesc: {
    color: "#D8CFF3",
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
  },
  rowMeta: {
    color: "#B7A9DD",
    marginTop: 3,
    fontSize: 12,
  },
  rowActions: {
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },
  iconBtnAlt: {
    backgroundColor: "#1D4ED8",
  },
  dangerBtn: {
    backgroundColor: "#DC2626",
  },
});
