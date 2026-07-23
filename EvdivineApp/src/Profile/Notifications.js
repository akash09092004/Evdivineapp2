import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { listMyBookings } from "../Services/bookingApi";

const readBookings = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  const items = payload?.items ?? payload?.bookings ?? payload ?? [];
  return Array.isArray(items) ? items : [];
};

const formatRelative = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));

  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const buildNotifications = (bookings) =>
  bookings.slice(0, 12).map((booking) => {
    const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();
    const bookingStatus = String(booking?.bookingStatus || "").toLowerCase();
    const cancelled = bookingStatus.includes("cancel");
    const completed = paymentStatus === "completed" || bookingStatus === "confirmed";
    const title = cancelled
      ? "Booking cancelled"
      : completed
      ? "Booking confirmed"
      : paymentStatus === "pending" || bookingStatus === "payment_pending"
      ? "Payment pending"
      : "Booking update";

    const message = cancelled
      ? "Aapki recent booking cancel ho gayi hai."
      : completed
      ? "Payment successful aur booking active hai."
      : paymentStatus === "pending" || bookingStatus === "payment_pending"
      ? "Payment complete karne ke liye action pending hai."
      : "Your booking status has changed.";

    const icon = cancelled
      ? "close-circle-outline"
      : completed
      ? "checkmark-done-circle-outline"
      : "time-outline";

    return {
      id: booking?._id || booking?.bookingNumber,
      title,
      message,
      time: formatRelative(booking?.updatedAt || booking?.createdAt || booking?.startAt),
      icon,
      unread: paymentStatus !== "completed" && !cancelled,
    };
  });

export default function Notifications({ navigation }) {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    if (!authToken) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await listMyBookings({
        page: 1,
        limit: 50,
        authToken,
      });
      setBookings(readBookings(response));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const notifications = useMemo(() => buildNotifications(bookings), [bookings]);
  const unreadCount = notifications.filter((item) => item.unread).length;

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.unread && styles.cardUnread]}>
      <View style={styles.iconBox}>
        <Ionicons name={item.icon} size={24} color="#A34B1F" />
      </View>

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.title}>{item.title}</Text>
          {item.unread ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F8E8C7" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={22} color="#4E2513" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount} unread, powered by booking activity
          </Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="large" color="#A34B1F" />
              <Text style={styles.emptyTitle}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={56} color="#B69A7B" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                Jab bookings ya payments update honge, yahin dikh jayenge.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8E8C7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#4E2513",
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#8B5F49",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFDF8",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: "#E7D2B5",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF1DB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#4E2513",
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#5C4331",
  },
  time: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5F49",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A34B1F",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 72,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#4E2513",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#8B5F49",
    textAlign: "center",
  },
});
