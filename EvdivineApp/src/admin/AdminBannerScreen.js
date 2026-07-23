import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
  TextInput,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

const emptyForm = {
  title: "",
  subtitle: "",
  linkType: "none",
  linkValue: "",
  description: "",
  shortDescription: "",
  longContent: "",
  benefits: "",
  consultationPrice: "",
  offerPrice: "",
  sortOrder: "0",
  isActive: true,
};

const linkTypes = [
  { label: "None", value: "none" },
  { label: "Screen", value: "screen" },
  { label: "URL", value: "url" },
  { label: "Service", value: "service" },
  { label: "Rashi", value: "rashi" },
];

export default function AdminBannerScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const getToken = useCallback(async () => AsyncStorage.getItem("adminToken"), []);

  const loadBanners = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/banners`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to load banners");
    }
    setItems(data?.data || []);
  }, [getToken, navigation]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadBanners();
      } catch (error) {
        Alert.alert("Error", error.message || "Unable to load banners");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBanners]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await loadBanners();
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to load banners");
    } finally {
      setRefreshing(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImageFile = async () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      };
      input.click();
      return;
    }

    Alert.alert(
      "Image Picker",
      "Native file picker ke liye `expo-image-picker` add karna hoga. Abhi admin banner web browser me file upload kare."
    );
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setImageFile(null);
    setImagePreview("");
  };

  const submit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Required", "Title is required");
      return;
    }

    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("subtitle", form.subtitle.trim());
      formData.append("linkType", form.linkType);
      formData.append("linkValue", form.linkValue.trim());
      formData.append("description", form.description.trim());
      formData.append("shortDescription", form.shortDescription.trim());
      formData.append("longContent", form.longContent.trim());
      formData.append("benefits", form.benefits.trim());
      formData.append("consultationPrice", String(Number(form.consultationPrice || 0)));
      formData.append("offerPrice", String(Number(form.offerPrice || 0)));
      formData.append("sortOrder", String(Number(form.sortOrder || 0)));
      formData.append("isActive", String(form.isActive));
      if (imageFile) {
        if (Platform.OS === "web") {
          formData.append("image", imageFile, imageFile.name || `banner-${Date.now()}.jpg`);
        } else {
          formData.append("image", {
            uri: imageFile.uri || imageFile.path || "",
            name: imageFile.name || `banner-${Date.now()}.jpg`,
            type: imageFile.type || "image/jpeg",
          });
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/banners${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to save banner");
      }

      resetForm();
      await loadBanners();
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to save banner");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      linkType: item.linkType || "none",
      linkValue: item.linkValue || "",
      description: item.description || "",
      shortDescription: item.shortDescription || item.description || "",
      longContent: item.longContent || "",
      benefits: item.benefits || "",
      consultationPrice: String(item.consultationPrice ?? 0),
      offerPrice: String(item.offerPrice ?? 0),
      sortOrder: String(item.sortOrder ?? 0),
      isActive: Boolean(item.isActive),
    });
    setImageFile(null);
    setImagePreview(item.imageUrl || "");
  };

  const removeItem = async (id) => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    Alert.alert("Delete Banner", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/admin/banners/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || "Unable to delete banner");
            }
            if (editingId === id) resetForm();
            await loadBanners();
          } catch (error) {
            Alert.alert("Error", error.message || "Unable to delete banner");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Latest Offers</Text>
          <Text style={styles.subtitle}>Homepage offer cards create, edit aur manage karo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.formCard} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{editingId ? "Edit Offer" : "Add Offer"}</Text>

        <TextInput
          style={styles.input}
          placeholder="Offer Title"
          placeholderTextColor="#9F90C5"
          value={form.title}
          onChangeText={(t) => setField("title", t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Subtitle"
          placeholderTextColor="#9F90C5"
          value={form.subtitle}
          onChangeText={(t) => setField("subtitle", t)}
        />
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder="Short Description"
          placeholderTextColor="#9F90C5"
          value={form.shortDescription}
          onChangeText={(t) => setField("shortDescription", t)}
          multiline
        />
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder="Long Content"
          placeholderTextColor="#9F90C5"
          value={form.longContent}
          onChangeText={(t) => setField("longContent", t)}
          multiline
        />
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder="Benefits (comma separated or new lines)"
          placeholderTextColor="#9F90C5"
          value={form.benefits}
          onChangeText={(t) => setField("benefits", t)}
          multiline
        />
        <View style={styles.priceRow}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Consultation Price ($)"
            placeholderTextColor="#9F90C5"
            keyboardType="numeric"
            value={form.consultationPrice}
            onChangeText={(t) => setField("consultationPrice", t)}
          />
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Offer Price ($)"
            placeholderTextColor="#9F90C5"
            keyboardType="numeric"
            value={form.offerPrice}
            onChangeText={(t) => setField("offerPrice", t)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Link value"
          placeholderTextColor="#9F90C5"
          value={form.linkValue}
          onChangeText={(t) => setField("linkValue", t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#9F90C5"
          value={form.description}
          onChangeText={(t) => setField("description", t)}
        />
        <TextInput
          style={styles.input}
          placeholder="Sort order"
          placeholderTextColor="#9F90C5"
          keyboardType="numeric"
          value={form.sortOrder}
          onChangeText={(t) => setField("sortOrder", t)}
        />

        <View style={styles.pillsRow}>
          {linkTypes.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.pill, form.linkType === item.value && styles.pillActive]}
              onPress={() => setField("linkType", item.value)}
            >
              <Text style={[styles.pillText, form.linkType === item.value && styles.pillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.fileBtn} onPress={pickImageFile}>
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={styles.fileBtnText}>
            {imageFile ? "Change Image File" : "Choose Image File"}
          </Text>
        </TouchableOpacity>

        {imagePreview ? (
          <Image source={{ uri: imagePreview }} style={styles.preview} />
        ) : null}

        <TouchableOpacity style={styles.switchRow} onPress={() => setField("isActive", !form.isActive)}>
          <Text style={styles.switchText}>Active</Text>
          <View style={[styles.toggle, form.isActive && styles.toggleActive]}>
            <View style={[styles.toggleKnob, form.isActive && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetForm}>
            <Text style={styles.secondaryBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={submit} disabled={saving}>
            <Text style={styles.primaryBtnText}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading banners...</Text>
          ) : (
            <Text style={styles.emptyText}>No banners found</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {!!item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbFallback}>
                <Ionicons name="image-outline" size={26} color="#7C3AED" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle || "No subtitle"}</Text>
              <Text style={styles.meta}>$ {Number(item.offerPrice || 0).toFixed(2)} offer | $ {Number(item.consultationPrice || 0).toFixed(2)} price</Text>
              <Text style={styles.meta}>Link: {item.linkType || "none"} {item.linkValue ? `| ${item.linkValue}` : ""}</Text>
              <Text style={styles.meta}>Sort: {item.sortOrder || 0} | {item.isActive ? "Active" : "Hidden"}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(item)}>
                <Ionicons name="create-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.dangerBtn]} onPress={() => removeItem(item._id)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#2E160B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#D8CFF3", fontSize: 13, marginTop: 3 },
  formCard: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    color: "#fff",
    paddingHorizontal: 14,
    height: 48,
  },
  textAreaInput: {
    height: 92,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
  },
  priceInput: {
    flex: 1,
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
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: "#1A0B3D",
    marginTop: 6,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  pillActive: {
    backgroundColor: "#7C3AED",
  },
  pillText: {
    color: "#D8CFF3",
    fontWeight: "800",
    fontSize: 12,
  },
  pillTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
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
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  secondaryBtnText: { color: "#fff", fontWeight: "900" },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
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
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5EAFF",
  },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  cardSub: { color: "#D8CFF3", marginTop: 2 },
  meta: { color: "#B7A9DD", marginTop: 3, fontSize: 12 },
  cardActions: {
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
  dangerBtn: {
    backgroundColor: "#DC2626",
  },
  emptyText: {
    color: "#D8CFF3",
    textAlign: "center",
    marginTop: 20,
  },
});
