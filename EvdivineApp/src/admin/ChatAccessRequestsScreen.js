import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";

const statusTabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function ChatAccessRequestsScreen({ navigation }) {
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const statusRef = useRef(status);

  const getToken = useCallback(
    async () => AsyncStorage.getItem("adminToken"),
    []
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const loadRequests = useCallback(
    async (nextStatus = statusRef.current, options = {}) => {
      const { showLoading = false } = options;
      const token = await getToken();
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/chat-access-requests?status=${encodeURIComponent(
            nextStatus
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          Alert.alert("Error", data.message || "Unable to load requests");
          return;
        }

        setRequests(data?.data?.requests || []);
      } catch (error) {
        Alert.alert("Error", error.message || "Unable to load requests");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [getToken, navigation]
  );

  useEffect(() => {
    (async () => {
      await loadRequests(statusRef.current, { showLoading: true });
    })();
  }, [loadRequests, status]);

  const refresh = async () => {
    setRefreshing(true);
    await loadRequests(statusRef.current, { showLoading: false });
    setRefreshing(false);
  };

  const updateRequest = async (id, action) => {
    const token = await getToken();
    if (!token) {
      navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      return;
    }

    const endpoint =
      action === "approve"
        ? `/api/admin/chat-access-requests/${id}/approve`
        : `/api/admin/chat-access-requests/${id}/reject`;
    const payload =
      action === "approve"
        ? { status: "approved" }
        : { status: "rejected", reason: "" };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.message || "Unable to update request");
        return;
      }

      await loadRequests(statusRef.current, { showLoading: false });
    } catch (error) {
      Alert.alert("Error", error.message || "Unable to update request");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.chatAccessStatus || "pending"}
          </Text>
        </View>
        <Text style={styles.date}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
        </Text>
      </View>

      <Text style={styles.name}>{item.name || "Unknown User"}</Text>
      <Text style={styles.meta}>{item.email || "No email"}</Text>
      {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => updateRequest(item._id, "approve")}
        >
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => updateRequest(item._id, "reject")}
        >
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chat Approval</Text>
          <Text style={styles.subtitle}>Review signup verified users</Text>
        </View>
        <TouchableOpacity
          style={styles.bannerBtn}
          onPress={() => navigation.navigate("AdminBanners")}
        >
          <Ionicons name="images-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pricingBtn}
          onPress={() => navigation.navigate("AdminPricing")}
        >
          <Ionicons name="time-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messagesBtn}
          onPress={() => navigation.navigate("AdminContactMessages")}
        >
          <Ionicons name="mail-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, status === tab.key && styles.tabActive]}
            onPress={() => setStatus(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                status === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading requests...</Text>
          ) : (
            <Text style={styles.emptyText}>No requests found</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#2E160B",
  },
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
  bannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  pricingBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#C06A3B",
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
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  tabActive: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    color: "#D8CFF3",
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#fff",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "rgba(124,58,237,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  date: {
    color: "#D8CFF3",
    fontSize: 12,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: "#D8CFF3",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtn: {
    backgroundColor: "#16A34A",
  },
  rejectBtn: {
    backgroundColor: "#DC2626",
  },
  actionText: {
    color: "#fff",
    fontWeight: "900",
  },
  emptyText: {
    color: "#D8CFF3",
    textAlign: "center",
    marginTop: 40,
  },
});
