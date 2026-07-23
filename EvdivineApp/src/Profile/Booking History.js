import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { cancelMyBooking, listMyBookings } from "../Services/bookingApi";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "payment_pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

const readBookings = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  const items = payload?.items ?? payload?.bookings ?? payload ?? [];
  return Array.isArray(items) ? items : [];
};

const formatDateTime = (value) => {
  if (!value) return "TBA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const getStatusTone = (booking) => {
  const bookingStatus = String(booking?.bookingStatus || "").toLowerCase();
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();

  if (bookingStatus.includes("cancel")) {
    return { label: "Cancelled", style: "cancelled" };
  }

  if (paymentStatus === "pending" || bookingStatus === "payment_pending") {
    return { label: "Payment pending", style: "pending" };
  }

  if (paymentStatus === "completed" || bookingStatus === "confirmed") {
    return { label: "Confirmed", style: "confirmed" };
  }

  return { label: booking?.bookingStatus || "Live", style: "live" };
};

const matchesFilter = (booking, filter) => {
  if (filter === "all") return true;

  const bookingStatus = String(booking?.bookingStatus || "").toLowerCase();
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();
  const startAt = booking?.startAt ? new Date(booking.startAt) : null;
  const now = new Date();

  if (filter === "upcoming") {
    return (
      startAt &&
      !Number.isNaN(startAt.getTime()) &&
      startAt.getTime() >= now.getTime() &&
      bookingStatus !== "cancelled"
    );
  }

  if (filter === "cancelled") {
    return bookingStatus.includes("cancel");
  }

  if (filter === "payment_pending") {
    return paymentStatus === "pending" || bookingStatus === "payment_pending";
  }

  return bookingStatus === filter || paymentStatus === filter;
};

export default function BookingHistory({ navigation }) {
  const { authToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const loadBookings = useCallback(async () => {
    if (!authToken) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await listMyBookings({
        page: 1,
        limit: 100,
        authToken,
      });

      setBookings(readBookings(response));
    } catch (error) {
      Alert.alert("Booking history", error?.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.("focus", loadBookings);
    return unsubscribe;
  }, [navigation, loadBookings]);

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking, activeFilter)),
    [bookings, activeFilter]
  );

  const totals = useMemo(() => {
    const result = {
      all: bookings.length,
      upcoming: 0,
      pending: 0,
      completed: 0,
    };

    bookings.forEach((booking) => {
      const status = String(booking?.bookingStatus || "").toLowerCase();
      const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();
      const startAt = booking?.startAt ? new Date(booking.startAt) : null;
      const now = new Date();

      if (
        startAt &&
        !Number.isNaN(startAt.getTime()) &&
        startAt.getTime() >= now.getTime() &&
        !status.includes("cancel")
      ) {
        result.upcoming += 1;
      }

      if (paymentStatus === "pending" || status === "payment_pending") {
        result.pending += 1;
      }

      if (paymentStatus === "completed" || status === "confirmed") {
        result.completed += 1;
      }
    });

    return result;
  }, [bookings]);

  const handlePayNow = (item) => {
    navigation?.navigate?.("PaymentMethods", {
      bookingDetails: {
        bookingId: item?._id,
        bookingNumber: item?.bookingNumber,
        consultationType: item?.consultationType,
        amount: item?.finalAmount || item?.offerPrice || item?.basePrice,
        currency: item?.currency,
        paymentMethod: item?.paymentMethod || "wallet",
      },
    });
  };

  const handleCancel = (item) => {
    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMyBooking({
                bookingId: item?._id,
                reason: "Cancelled from booking history",
                authToken,
              });
              loadBookings();
            } catch (error) {
              Alert.alert("Cancel booking", error?.message || "Unable to cancel booking");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const tone = getStatusTone(item);
    const planTitle =
      item?.slotPlanId?.title || item?.priceSnapshot?.planTitle || "Consultation";
    const amount = item?.finalAmount || item?.offerPrice || item?.basePrice;
    const canPay =
      String(item?.paymentStatus || "").toLowerCase() === "pending" ||
      String(item?.bookingStatus || "").toLowerCase() === "payment_pending";
    const canCancel =
      !String(item?.bookingStatus || "").toLowerCase().includes("cancel") &&
      String(item?.bookingStatus || "").toLowerCase() !== "completed";

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {planTitle}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              #{item?.bookingNumber || item?._id}
            </Text>
          </View>

          <View style={[styles.statusPill, styles[tone.style]]}>
            <Text style={[styles.statusText, styles[`statusText_${tone.style}`]]}>
              {tone.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color="#8B5F49" />
          <Text style={styles.metaText}>{formatDateTime(item?.startAt)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color="#8B5F49" />
          <Text style={styles.metaText}>
            {item?.durationMinutes || item?.priceSnapshot?.durationMinutes || "--"} min
            {"  "}-{"  "}
            {item?.consultationType || "consultation"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={16} color="#8B5F49" />
          <Text style={styles.metaText}>
            {item?.currency || "INR"} {amount ?? "--"}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, canPay && styles.secondaryBtnStrong]}
            onPress={() =>
              Alert.alert(
                planTitle,
                [
                  `Booking: ${item?.bookingNumber || item?._id}`,
                  `Status: ${tone.label}`,
                  `Payment: ${item?.paymentStatus || "--"}`,
                  `Start: ${formatDateTime(item?.startAt)}`,
                ].join("\n")
              )
            }
          >
            <Text style={styles.secondaryBtnText}>View details</Text>
          </TouchableOpacity>

          {canPay ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePayNow(item)}>
              <Text style={styles.primaryBtnText}>Pay now</Text>
            </TouchableOpacity>
          ) : null}

          {canCancel ? (
            <TouchableOpacity style={styles.dangerBtn} onPress={() => handleCancel(item)}>
              <Text style={styles.dangerBtnText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8E8C7" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#4E2513" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Booking History</Text>
          <Text style={styles.headerSub}>
            Live bookings from backend
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totals.all}</Text>
          <Text style={styles.statLabel}>All</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totals.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totals.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totals.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item?._id || item?.bookingNumber}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadBookings();
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="large" color="#A34B1F" />
              <Text style={styles.emptyTitle}>Loading bookings...</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={56} color="#B69A7B" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                Backend se data nahi mila ya aapka filter empty hai.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  iconBtn: {
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF7E9",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#A34B1F",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#8B5F49",
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFF7E9",
  },
  filterChipActive: {
    backgroundColor: "#A34B1F",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B5F49",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFDF8",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#4E2513",
  },
  cardSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#8B5F49",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  confirmed: {
    backgroundColor: "#E6F7EE",
  },
  pending: {
    backgroundColor: "#FFF1DB",
  },
  cancelled: {
    backgroundColor: "#FDECEC",
  },
  live: {
    backgroundColor: "#E8EEF9",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusText_confirmed: {
    color: "#1C9B5E",
  },
  statusText_pending: {
    color: "#B45B00",
  },
  statusText_cancelled: {
    color: "#D93025",
  },
  statusText_live: {
    color: "#1E4FA8",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    color: "#5C4331",
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: "#F2E3CF",
  },
  secondaryBtnStrong: {
    backgroundColor: "#E9D1B2",
  },
  secondaryBtnText: {
    color: "#4E2513",
    fontWeight: "800",
    fontSize: 12,
  },
  primaryBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: "#A34B1F",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  dangerBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: "#F8DADA",
  },
  dangerBtnText: {
    color: "#B42318",
    fontWeight: "800",
    fontSize: 12,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
