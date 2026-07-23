import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors, Shadows } from "../theme/colors";
import LinearGradient from "../components/LinearGradient";
import {
  cancelMyBooking,
  getMyBooking,
  listMyBookings,
} from "../Services/bookingApi";

const FILTERS = [
  { key: "upcoming", label: "Upcoming", query: "upcoming" },
  { key: "payment_pending", label: "Pending", status: "payment_pending" },
  { key: "completed", label: "Completed", query: "completed" },
  { key: "cancelled", label: "Cancelled", query: "cancelled" },
];

const STATUS_META = {
  payment_pending: {
    label: "Payment Pending",
    color: Colors.primary,
    background: "rgba(163,75,31,0.10)",
  },
  confirmed: {
    label: "Confirmed",
    color: "#1976D2",
    background: "rgba(25,118,210,0.10)",
  },
  ready: {
    label: "Ready",
    color: "#0F9D58",
    background: "rgba(15,157,88,0.10)",
  },
  waiting_for_admin: {
    label: "Waiting Admin",
    color: "#8E44AD",
    background: "rgba(142,68,173,0.10)",
  },
  in_progress: {
    label: "In Progress",
    color: "#0B8043",
    background: "rgba(11,128,67,0.10)",
  },
  completed: {
    label: "Completed",
    color: "#0F9D58",
    background: "rgba(15,157,88,0.10)",
  },
  refunded: {
    label: "Refunded",
    color: "#B04A00",
    background: "rgba(176,74,0,0.10)",
  },
  cancelled_by_user: {
    label: "Cancelled",
    color: "#D93025",
    background: "rgba(217,48,37,0.10)",
  },
  cancelled_by_admin: {
    label: "Cancelled",
    color: "#D93025",
    background: "rgba(217,48,37,0.10)",
  },
  expired: {
    label: "Expired",
    color: "#777",
    background: "rgba(119,119,119,0.10)",
  },
};

const formatDate = (value) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "--";
  }
};

const formatTime = (value) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
};

const formatMoney = (amount, currency = "USD") => {
  const numeric = Number(amount || 0);
  return `${currency} ${numeric.toFixed(2)}`;
};

const getStatusMeta = (status = "") =>
  STATUS_META[String(status || "").toLowerCase()] || {
    label: String(status || "Unknown").replace(/_/g, " "),
    color: Colors.textMuted,
    background: Colors.gradientSoftStart,
  };

const getBookingTitle = (booking) =>
  booking?.slotPlanId?.title ||
  booking?.priceSnapshot?.planTitle ||
  booking?.consultationType ||
  "Consultation";

const getAdminTitle = (booking) =>
  booking?.adminId?.name ||
  booking?.adminId?.email ||
  booking?.adminName ||
  "Admin";

const getPaymentLabel = (booking) => {
  const method = String(booking?.paymentMethod || "").toLowerCase();
  if (method === "wallet") return "Wallet";
  if (method === "paypal") return "PayPal";
  return method || "--";
};

export default function MyBooking({ navigation, route }) {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 20,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const authMissing = !authReady || !isAuthenticated || !authToken;

  const activeFilterConfig = useMemo(
    () => FILTERS.find((item) => item.key === selectedFilter) || FILTERS[0],
    [selectedFilter]
  );

  const loadBookings = async ({ silent = false } = {}) => {
    if (authMissing) {
      setBookings([]);
      return;
    }

    if (!silent) setLoading(true);

    try {
      const params = {
        authToken,
        page: 1,
        limit: 20,
      };

      if (activeFilterConfig.query) {
        params.filter = activeFilterConfig.query;
      }
      if (activeFilterConfig.status) {
        params.status = activeFilterConfig.status;
      }

      const response = await listMyBookings(params);
      const payload = response?.data?.data || {};
      setBookings(Array.isArray(payload.items) ? payload.items : []);
      setSummary({
        total: Number(payload.total || 0),
        pages: Number(payload.pages || 1),
        page: Number(payload.page || 1),
        limit: Number(payload.limit || 20),
      });
    } catch (error) {
      Alert.alert(
        "Unable to load bookings",
        error?.response?.data?.message ||
          error?.message ||
          "Could not load bookings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    void loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken, isAuthenticated, selectedFilter]);

  useEffect(() => {
    if (!authReady || !route?.params?.refreshKey) {
      return;
    }

    void loadBookings({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authReady,
    route?.params?.refreshKey,
    authToken,
    isAuthenticated,
    selectedFilter,
  ]);

  const openBookingDetail = async (booking) => {
    const id = String(booking?._id || booking?.id || "").trim();
    if (!id) return;

    setDetailLoading(true);
    try {
      const response = await getMyBooking({ bookingId: id, authToken });
      const detail = response?.data?.data || booking;
      setSelectedBooking(detail);
    } catch (error) {
      setSelectedBooking(booking);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedBooking(null);

  const handlePayNow = (booking) => {
    const id = String(booking?._id || "").trim();
    if (!id) return;

    navigation?.navigate?.("PaymentMethods", {
      bookingId: id,
      amount: booking?.finalAmount || booking?.offerPrice || 0,
      currency: booking?.currency || "USD",
      consultationType: booking?.consultationType || "Booking",
      consultationDate: formatDate(booking?.startAt),
      consultationTime: `${formatTime(booking?.startAt)} - ${formatTime(
        booking?.endAt
      )}`,
      serviceName: getBookingTitle(booking),
      returnTo: "MyBooking",
      returnParams: {},
    });
  };

  const handleCancelBooking = (booking) => {
    const id = String(booking?._id || "").trim();
    if (!id) return;

    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMyBooking({
                bookingId: id,
                reason: "Cancelled from My Booking screen",
                authToken,
              });
              await loadBookings({ silent: true });
              setSelectedBooking(null);
              Alert.alert("Success", "Booking cancelled successfully.");
            } catch (error) {
              Alert.alert(
                "Cancel failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Could not cancel the booking."
              );
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({ item }) => {
    const status = String(item?.bookingStatus || "").toLowerCase();
    const meta = getStatusMeta(status);
    const isPayable = status === "payment_pending";
    const isCancelable = [
      "payment_pending",
      "confirmed",
      "ready",
      "waiting_for_admin",
      "in_progress",
    ].includes(status);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => openBookingDetail(item)}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.cardTitle}>{getBookingTitle(item)}</Text>
            <Text style={styles.cardSubtitle}>
              Booking #{item?.bookingNumber || item?._id?.slice?.(-6) || "--"}
            </Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: meta.background }]}
          >
            <Text style={[styles.statusText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={Colors.primary}
            />
            <Text style={styles.infoChipText}>{formatDate(item?.startAt)}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={15} color={Colors.primary} />
            <Text style={styles.infoChipText}>
              {formatTime(item?.startAt)} - {formatTime(item?.endAt)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Amount</Text>
            <Text style={styles.metaValue}>
              {formatMoney(
                item?.finalAmount || item?.offerPrice,
                item?.currency
              )}
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Payment</Text>
            <Text style={styles.metaValue}>{getPaymentLabel(item)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.adminTag}>
            <Ionicons name="person-outline" size={14} color={Colors.primary} />
            <Text style={styles.adminTagText}>{getAdminTitle(item)}</Text>
          </View>

          <View style={styles.actionRow}>
            {isCancelable ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(item)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}

            {isPayable ? (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => handlePayNow(item)}
              >
                <Text style={styles.payText}>Pay Now</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => openBookingDetail(item)}
              >
                <Text style={styles.detailsText}>View</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={Colors.bg} barStyle="dark-content" />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadBookings({ silent: true });
            }}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.heroBadge}>
              <Ionicons
                name="sparkles-outline"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.heroBadgeText}>Live booking center</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>My Booking</Text>
          <Text style={styles.heroSubtitle}>
            Track upcoming sessions, pay pending bookings, and manage
            cancellations from one place.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{summary.total}</Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{bookings.length}</Text>
              <Text style={styles.heroStatLabel}>Loaded</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>
                {activeFilterConfig.label}
              </Text>
              <Text style={styles.heroStatLabel}>Filter</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.filterWrap}>
          {FILTERS.map((item) => {
            const active = selectedFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                onPress={() => setSelectedFilter(item.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>Your bookings</Text>
            <Text style={styles.sectionSub}>
              Pull to refresh or tap a booking to view details.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setRefreshing(true);
              void loadBookings({ silent: true });
            }}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) =>
              String(item?._id || item?.bookingNumber || Math.random())
            }
            renderItem={renderBooking}
            scrollEnabled={false}
            contentContainerStyle={
              bookings.length ? styles.list : styles.emptyList
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={28}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No bookings found</Text>
                <Text style={styles.emptyText}>
                  {authMissing
                    ? "Please login to view your bookings."
                    : "Try a different filter or create a new booking."}
                </Text>
              </View>
            }
          />
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedBooking)}
        transparent
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <Text style={styles.modalSubtitle}>
                  Booking #{selectedBooking?.bookingNumber || "--"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeDetail}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.detailLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : selectedBooking ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                <View style={styles.detailHero}>
                  <View style={styles.detailHeroRow}>
                    <View style={styles.detailPlanIcon}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={20}
                        color="#fff"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailPlanTitle}>
                        {getBookingTitle(selectedBooking)}
                      </Text>
                      <Text style={styles.detailPlanSub}>
                        {getAdminTitle(selectedBooking)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusMeta(
                            selectedBooking?.bookingStatus
                          ).background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: getStatusMeta(selectedBooking?.bookingStatus)
                              .color,
                          },
                        ]}
                      >
                        {getStatusMeta(selectedBooking?.bookingStatus).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPrice}>
                      {formatMoney(
                        selectedBooking?.finalAmount ||
                          selectedBooking?.offerPrice,
                        selectedBooking?.currency
                      )}
                    </Text>
                    <Text style={styles.detailPriceHint}>
                      Payment: {getPaymentLabel(selectedBooking)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedBooking?.startAt)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(selectedBooking?.startAt)} -{" "}
                      {formatTime(selectedBooking?.endAt)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>
                      {selectedBooking?.durationMinutes || "--"} min
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Wallet</Text>
                    <Text style={styles.detailValue}>
                      {selectedBooking?.paymentMethod || "--"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailList}>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Booking ID</Text>
                    <Text style={styles.detailLineValue}>
                      {selectedBooking?._id}
                    </Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Slot Lock ID</Text>
                    <Text style={styles.detailLineValue}>
                      {selectedBooking?.slotLockId || "--"}
                    </Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Chat Room</Text>
                    <Text style={styles.detailLineValue}>
                      {selectedBooking?.chatRoomId || "--"}
                    </Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Refund Status</Text>
                    <Text style={styles.detailLineValue}>
                      {selectedBooking?.refundStatus || "--"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  {String(
                    selectedBooking?.bookingStatus || ""
                  ).toLowerCase() === "payment_pending" ? (
                    <TouchableOpacity
                      style={styles.detailPrimaryBtn}
                      onPress={() => {
                        const booking = selectedBooking;
                        closeDetail();
                        handlePayNow(booking);
                      }}
                    >
                      <Ionicons name="card-outline" size={18} color="#fff" />
                      <Text style={styles.detailPrimaryText}>Pay Now</Text>
                    </TouchableOpacity>
                  ) : null}

                  {[
                    "payment_pending",
                    "confirmed",
                    "ready",
                    "waiting_for_admin",
                    "in_progress",
                  ].includes(
                    String(selectedBooking?.bookingStatus || "").toLowerCase()
                  ) ? (
                    <TouchableOpacity
                      style={styles.detailSecondaryBtn}
                      onPress={() => {
                        const booking = selectedBooking;
                        closeDetail();
                        handleCancelBooking(booking);
                      }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={Colors.danger}
                      />
                      <Text style={styles.detailSecondaryText}>
                        Cancel Booking
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingBottom: 26,
  },
  hero: {
    margin: 16,
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    ...Shadows.lg,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 18,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  filterWrap: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontWeight: "800",
    fontSize: 12,
  },
  filterTextActive: {
    color: "#fff",
  },
  sectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: Colors.textMuted,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gradientSoftStart,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoChipText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaBlock: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  metaValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
    flexWrap: "wrap",
  },
  adminTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(163,75,31,0.10)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  adminTagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "900",
  },
  payBtn: {
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  payText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  detailsBtn: {
    borderRadius: 14,
    backgroundColor: Colors.gradientSoftStart,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailsText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLoading: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  modalContent: {
    paddingBottom: 10,
  },
  detailHero: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...Shadows.card,
  },
  detailHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailPlanIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  detailPlanTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  detailPlanSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  detailPriceRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailPrice: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  detailPriceHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  detailItem: {
    width: "48.5%",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  detailValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
  },
  detailList: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 14,
    padding: 14,
    gap: 12,
  },
  detailLine: {
    gap: 5,
  },
  detailLineLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  detailLineValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  detailPrimaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  detailPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  detailSecondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  detailSecondaryText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: "900",
  },
});
