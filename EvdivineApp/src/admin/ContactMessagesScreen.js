import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

const normalizePath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "/admin/send-email";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const BULK_EMAIL_ENDPOINT = normalizePath(
  process.env.EXPO_PUBLIC_ADMIN_BULK_EMAIL_ENDPOINT || "/admin/send-email"
);

const buildApiUrl = (path) => {
  const normalized = normalizePath(path);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return `${API_BASE_URL}/api${normalized}`;
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "archived", label: "Closed" },
  { key: "replied", label: "Replied" },
];

const normalizeStatus = (value) => {
  const status = String(value || "new").trim().toLowerCase();
  if (status === "closed") return "archived";
  return status;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export default function ContactMessagesScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const getToken = useCallback(() => AsyncStorage.getItem("adminToken"), []);

  const loadMessages = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const response = await fetch(buildApiUrl("/admin/drop-messages"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await readResponseBody(response);
    if (!response.ok) {
      throw new Error(payload?.message || "Unable to load contact messages");
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    setMessages(rows);
    setSelectedId((current) => {
      if (current && rows.some((item) => item._id === current)) {
        return current;
      }
      return rows[0]?._id || "";
    });
  }, [getToken, navigation]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadMessages();
      } catch (error) {
        Alert.alert("Error", error?.message || "Unable to load contact messages");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMessages]);

  const filteredMessages = useMemo(() => {
    if (activeFilter === "all") {
      return messages;
    }
    return messages.filter((item) => normalizeStatus(item.status) === activeFilter);
  }, [activeFilter, messages]);

  const selectedMessage = useMemo(
    () => filteredMessages.find((item) => item._id === selectedId) || filteredMessages[0] || null,
    [filteredMessages, selectedId]
  );

  useEffect(() => {
    if (selectedMessage && selectedMessage._id !== selectedId) {
      setSelectedId(selectedMessage._id);
    }
  }, [selectedMessage, selectedId]);

  useEffect(() => {
    setReplyText(selectedMessage?.reply || selectedMessage?.adminReply || "");
  }, [
    selectedMessage?._id,
    selectedMessage?.reply,
    selectedMessage?.adminReply,
    selectedMessage?.replyMessage,
    selectedMessage?.response,
  ]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await loadMessages();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to load contact messages");
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (id, status) => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    try {
      setUpdatingId(id);
      const response = await fetch(buildApiUrl(`/admin/drop-messages/${id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await readResponseBody(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to update message");
      }

      await loadMessages();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to update message");
    } finally {
      setUpdatingId("");
    }
  };

  const sendReply = async () => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    if (!selectedMessage?._id) {
      Alert.alert("Error", "Please select a message first.");
      return;
    }

    const message = String(replyText || "").trim();
    if (!message) {
      Alert.alert("Error", "Reply text is required");
      return;
    }

    try {
      setSendingReply(true);
      const response = await fetch(buildApiUrl(BULK_EMAIL_ENDPOINT), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedMessage._id,
          dropMessageId: selectedMessage._id,
          to: selectedMessage.email,
          email: selectedMessage.email,
          subject: selectedMessage.subject,
          name: selectedMessage.name,
          reply: message,
          adminReply: message,
          replyMessage: message,
          response: message,
          fromName: "EvDivine",
        }),
      });
      const payload = await readResponseBody(response);
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to send reply");
      }

      if (payload?.meta?.emailError) {
        Alert.alert("Saved", `${payload.message || "Reply saved"}\n\nEmail note: ${payload.meta.emailError}`);
      } else {
        Alert.alert("Success", payload?.message || "Reply sent successfully");
      }

      await loadMessages();
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = item._id === selectedId;
    const dateLabel = formatDate(item.date || item.createdAt);
    const status = normalizeStatus(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedId(item._id)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.badge, statusBadgeStyles[status] || styles.badge]}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <Text style={styles.name}>{item.name || "Unknown"}</Text>
        <Text style={styles.meta}>{item.email || "No email"}</Text>
        {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
        {item.subject ? <Text style={styles.subject}>{item.subject}</Text> : null}
        <Text style={styles.message} numberOfLines={2}>
          {item.message || "No message"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading contact messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Contact User</Text>
          <Text style={styles.subtitle}>Admin Panel</Text>
        </View>
        <View style={styles.profileBtn}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      </View>

      <View style={styles.tabs}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.tabText, activeFilter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <FlatList
          data={filteredMessages}
          keyExtractor={(item, index) => item._id || `${item.email || "msg"}-${index}`}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No contact messages found</Text>}
        />

        {selectedMessage ? (
          <View style={styles.detailCard}>
            <View style={styles.detailTop}>
              <View>
                <Text style={styles.detailTitle}>{selectedMessage.name || "Unknown"}</Text>
                <Text style={styles.detailSub}>{selectedMessage.email || "No email"}</Text>
              </View>
              <View style={[styles.badge, statusBadgeStyles[normalizeStatus(selectedMessage.status)] || styles.badge]}>
                <Text style={styles.badgeText}>{normalizeStatus(selectedMessage.status)}</Text>
              </View>
            </View>

            {selectedMessage.phone ? <Text style={styles.detailMeta}>{selectedMessage.phone}</Text> : null}
            {selectedMessage.subject ? <Text style={styles.detailSubject}>{selectedMessage.subject}</Text> : null}
            <Text style={styles.detailMessage}>{selectedMessage.message || "No message"}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(selectedMessage.date || selectedMessage.createdAt)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Reply at</Text>
                <Text style={styles.infoValue}>{formatDate(selectedMessage.replyAt)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Reply to User</Text>
            <Text style={styles.sectionHint}>Reply bhejne par status automatically replied set ho jayega.</Text>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type reply here..."
              placeholderTextColor="#A5A0B8"
              style={styles.replyInput}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.sendBtn, sendingReply && styles.sendBtnDisabled]}
              onPress={sendReply}
              disabled={sendingReply}
            >
              {sendingReply ? (
              <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.sendBtnText}>Send Reply</Text>
              )}
            </TouchableOpacity>

            <View style={styles.statusActions}>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusNew]}
                onPress={() => updateStatus(selectedMessage._id, "new")}
                disabled={updatingId === selectedMessage._id}
              >
                <Text style={styles.statusBtnText}>Mark New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusRead]}
                onPress={() => updateStatus(selectedMessage._id, "read")}
                disabled={updatingId === selectedMessage._id}
              >
                <Text style={styles.statusBtnText}>Mark Read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, styles.statusClosed]}
                onPress={() => updateStatus(selectedMessage._id, "archived")}
                disabled={updatingId === selectedMessage._id}
              >
                <Text style={styles.statusBtnText}>Mark Closed</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.currentReplyCard}>
              <Text style={styles.currentReplyLabel}>Current Reply</Text>
              <Text style={styles.currentReplyText}>
                {selectedMessage.reply || selectedMessage.adminReply || selectedMessage.replyMessage || selectedMessage.response || "No reply yet"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Select a message to view details</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const statusBadgeStyles = {
  new: { backgroundColor: "#EFE7FF" },
  read: { backgroundColor: "#DBF4FF" },
  archived: { backgroundColor: "#E7EAF0" },
  replied: { backgroundColor: "#DDF7E7" },
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12081E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
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
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6D28D9",
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
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    color: "#E9DFFB",
    fontWeight: "800",
    fontSize: 12,
  },
  tabTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#6D28D9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  date: {
    color: "#7A748A",
    fontSize: 12,
  },
  name: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: "#4B5563",
    marginTop: 4,
  },
  subject: {
    marginTop: 10,
    color: "#8B2BE2",
    fontSize: 13,
    fontWeight: "800",
  },
  message: {
    marginTop: 8,
    color: "#1F2937",
    lineHeight: 20,
  },
  detailCard: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 20,
    padding: 16,
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  detailTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
  detailSub: {
    color: "#6B7280",
    marginTop: 4,
  },
  detailMeta: {
    marginTop: 8,
    color: "#4B5563",
  },
  detailSubject: {
    marginTop: 12,
    color: "#8B2BE2",
    fontSize: 14,
    fontWeight: "800",
  },
  detailMessage: {
    marginTop: 10,
    color: "#1F2937",
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  infoItem: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: "#F4F1FF",
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    color: "#6D28D9",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    marginTop: 6,
    color: "#111827",
    fontWeight: "700",
  },
  sectionLabel: {
    marginTop: 18,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 12,
  },
  replyInput: {
    marginTop: 10,
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FDFDFF",
    padding: 14,
    color: "#111827",
    fontSize: 15,
  },
  sendBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  statusBtn: {
    flexGrow: 1,
    minWidth: 92,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statusNew: {
    backgroundColor: "#2563EB",
  },
  statusRead: {
    backgroundColor: "#0F766E",
  },
  statusClosed: {
    backgroundColor: "#6B7280",
  },
  statusBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  currentReplyCard: {
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
  },
  currentReplyLabel: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
  },
  currentReplyText: {
    marginTop: 8,
    color: "#1F2937",
    lineHeight: 20,
  },
  emptyText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 14,
    fontWeight: "700",
  },
});
