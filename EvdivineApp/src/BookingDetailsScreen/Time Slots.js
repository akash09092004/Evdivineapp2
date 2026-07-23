import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import LinearGradient from "../components/LinearGradient";
import { Colors, Shadows } from "../theme/colors";
import { fetchAvailableSlots, fetchChatSlotPlans } from "../Services/bookingApi";

const FALLBACK_PLANS = [
  { id: "fallback-20", durationMinutes: 20, basePrice: 10, offerPrice: 8, title: "20 Minutes" },
  { id: "fallback-40", durationMinutes: 40, basePrice: 18, offerPrice: 14, title: "40 Minutes" },
  { id: "fallback-60", durationMinutes: 60, basePrice: 24, offerPrice: 18, title: "60 Minutes" },
];

const WORK_START = 9 * 60;
const WORK_END = 21 * 60;

const formatMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "USD").toUpperCase(),
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const safeDateKey = (date) => {
  const safe = date instanceof Date ? date : new Date(date);
  const year = safe.getFullYear();
  const month = String(safe.getMonth() + 1).padStart(2, "0");
  const day = String(safe.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateOptions = (count = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
};

const formatDateLabel = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatLongDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getUserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const getTimeZoneLabel = (timeZone) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value || timeZone;
  } catch {
    return timeZone;
  }
};

const formatTimeLabel = (minutes) => {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const toMinutes = (clock) => {
  const [hourRaw = "0", minuteRaw = "0"] = String(clock || "0:0").split(":");
  return Number(hourRaw) * 60 + Number(minuteRaw);
};

const getPeriod = (minutes) => {
  const hour = Math.floor(minutes / 60);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const getPeriodIcon = (period) => {
  if (period === "Morning") return "sunny-outline";
  if (period === "Afternoon") return "partly-sunny-outline";
  return "moon-outline";
};

const getPeriodColor = (period) => {
  if (period === "Morning") return "#E7A23B";
  if (period === "Afternoon") return "#D97706";
  return "#7C3AED";
};

const getDiscountPercent = (price, originalPrice) => {
  if (!originalPrice) return 0;
  return Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100);
};

const parseItems = (response) => {
  const raw = response?.data?.data ?? response?.data ?? response ?? {};
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.plans)) return raw.plans;
  if (Array.isArray(raw.slots)) return raw.slots;
  return [];
};

const normalizePlans = (items) =>
  (items || [])
    .map((plan) => {
      const id = String(plan?._id || plan?.id || "").trim();
      const durationMinutes = Number(plan?.durationMinutes || 0);
      const basePrice = Number(plan?.basePrice ?? plan?.originalPrice ?? 0);
      const offerPrice = Number(plan?.offerPrice ?? plan?.price ?? 0);
      if (!id || !durationMinutes) {
        return null;
      }

      return {
        id,
        title: String(plan?.title || `${durationMinutes} Minutes`).trim(),
        durationMinutes,
        basePrice,
        offerPrice,
        currency: String(plan?.currency || "USD").toUpperCase(),
        isPopular: Boolean(plan?.isPopular),
        offerPercent: getDiscountPercent(offerPrice, basePrice),
      };
    })
    .filter(Boolean);

const normalizeSlots = (items, plan, timezone = "") =>
  (items || [])
    .map((slot, index) => {
      const startAt = slot?.startAt || "";
      const endAt = slot?.endAt || "";
      const localStart = String(slot?.localStartTime || "").trim();
      const localEnd = String(slot?.localEndTime || "").trim();
      const startMinutes = getMinutesFromDate(startAt) ?? (localStart ? toMinutes(localStart) : 0);
      const endMinutes =
        getMinutesFromDate(endAt) ?? (localEnd ? toMinutes(localEnd) : startMinutes + Number(plan?.durationMinutes || 0));
      const period = getPeriod(startMinutes);
      const price = Number(slot?.price ?? plan?.offerPrice ?? 0);
      const originalPrice = Number(plan?.basePrice ?? price);
      const offerPercent = getDiscountPercent(price, originalPrice);
      const status = String(slot?.status || "available").toLowerCase();

      return {
        id: String(slot?._id || slot?.id || `${safeDateKey(startAt || new Date())}-${index}`),
        planId: String(slot?.planId || plan?.id || "").trim(),
        startAt,
        timezone: String(slot?.timezone || timezone || "").trim(),
        startLabel: startAt ? formatClockLabelFromDate(startAt) : localStart ? formatClockLabel(localStart) : "--:--",
        endLabel: endAt ? formatClockLabelFromDate(endAt) : localEnd ? formatClockLabel(localEnd) : "--:--",
        period,
        periodIcon: getPeriodIcon(period),
        periodColor: getPeriodColor(period),
        status,
        price,
        originalPrice,
        offerPercent,
      };
    })
    .filter(Boolean);

const formatClockLabel = (clock24) => {
  const [hourRaw = "0", minuteRaw = "0"] = String(clock24 || "0:0").split(":");
  const hour24 = Number(hourRaw);
  const minute = Number(minuteRaw);
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const formatClockLabelFromDate = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getMinutesFromDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
};

const toIsoAtMinutes = (date, minutes) => {
  const safeDate = date instanceof Date ? new Date(date) : new Date(date);
  const hours = Math.floor(Number(minutes || 0) / 60);
  const mins = Number(minutes || 0) % 60;
  safeDate.setHours(hours, mins, 0, 0);
  return safeDate.toISOString();
};

const buildFallbackSlots = (date, plan, timezone = "") => {
  const duration = Number(plan?.durationMinutes || 20);
  const price = Number(plan?.offerPrice || 0);
  const originalPrice = Number(plan?.basePrice || price);
  const selectedDateKey = safeDateKey(date);
  const todayKey = safeDateKey(new Date());
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = [];

  for (
    let startMinutes = WORK_START, index = 0;
    startMinutes + duration <= WORK_END;
    startMinutes += duration, index += 1
  ) {
    const endMinutes = startMinutes + duration;
    const isPastToday = selectedDateKey === todayKey && startMinutes <= nowMinutes + 10;
    const status = isPastToday ? "booked" : index % 4 === 3 ? "locked" : "available";
    const period = getPeriod(startMinutes);

    slots.push({
      id: `${selectedDateKey}-${duration}-${startMinutes}`,
      planId: plan?.id || "",
      startAt: toIsoAtMinutes(date, startMinutes),
      timezone: String(timezone || "").trim(),
      startLabel: formatTimeLabel(startMinutes),
      endLabel: formatTimeLabel(endMinutes),
      period,
      periodIcon: getPeriodIcon(period),
      periodColor: getPeriodColor(period),
      status,
      price,
      originalPrice,
      offerPercent: getDiscountPercent(price, originalPrice),
    });
  }

  return slots;
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function TimeSlots({
  serviceName = "Chat Consultation",
  consultationType = "Chat",
  onBack,
  onContinue,
  loadingBooking = false,
  authToken = "",
  initialPlanId = "",
}) {
  const { width } = useWindowDimensions();
  const userTimeZone = useMemo(() => getUserTimeZone(), []);
  const userTimeZoneLabel = useMemo(() => getTimeZoneLabel(userTimeZone), [userTimeZone]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlanId, setSelectedPlanId] = useState(String(initialPlanId || "").trim());
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [slotPlans, setSlotPlans] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [warningText, setWarningText] = useState("");

  const dateOptions = useMemo(() => buildDateOptions(7), []);

  useEffect(() => {
    setSelectedPlanId(String(initialPlanId || "").trim());
  }, [initialPlanId]);

  useEffect(() => {
    let alive = true;

    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        if (!authToken) {
          if (!alive) return;
          setSlotPlans(
            FALLBACK_PLANS.map((plan) => ({
              ...plan,
              currency: "USD",
              offerPercent: getDiscountPercent(plan.offerPrice, plan.basePrice),
            }))
          );
          setSelectedPlanId((current) => current || FALLBACK_PLANS[0].id);
          setWarningText(
            "Live slot plans dekhne ke liye login karein. Abhi fallback options dikh rahe hain."
          );
          return;
        }

        const response = await fetchChatSlotPlans({ authToken });
        const normalized = normalizePlans(parseItems(response));
        if (!alive) return;

        if (normalized.length) {
          setSlotPlans(normalized);
          setSelectedPlanId((current) => {
            if (current && normalized.some((plan) => plan.id === current)) {
              return current;
            }
            return normalized[0].id;
          });
          return;
        }

        setSlotPlans(
          FALLBACK_PLANS.map((plan) => ({
            ...plan,
            currency: "USD",
            offerPercent: getDiscountPercent(plan.offerPrice, plan.basePrice),
          }))
        );
        setSelectedPlanId((current) => current || FALLBACK_PLANS[0].id);
      } catch (error) {
        if (!alive) return;
        setSlotPlans(
          FALLBACK_PLANS.map((plan) => ({
            ...plan,
            currency: "USD",
            offerPercent: getDiscountPercent(plan.offerPrice, plan.basePrice),
          }))
        );
        setWarningText(
          error?.response?.data?.message ||
            "Plans load nahi ho paye. Fallback booking options use ho rahe hain."
        );
        setSelectedPlanId((current) => current || FALLBACK_PLANS[0].id);
      } finally {
        if (alive) {
          setLoadingPlans(false);
        }
      }
    };

    void loadPlans();

    return () => {
      alive = false;
    };
  }, [authToken]);

  const selectedPlan = useMemo(() => {
    const current = slotPlans.find((plan) => plan.id === selectedPlanId);
    if (current) return current;
    return slotPlans[0] || FALLBACK_PLANS[0];
  }, [slotPlans, selectedPlanId]);

  const isFallbackPlan = String(selectedPlan?.id || "").startsWith("fallback-");

  useEffect(() => {
    let alive = true;
    setSelectedSlotId("");
    setWarningText("");

    const loadSlots = async () => {
      if (!selectedPlan?.id) {
        setSlots([]);
        return;
      }

      if (!authToken) {
        const fallback = buildFallbackSlots(selectedDate, selectedPlan, userTimeZone);
        if (!alive) return;
        setSlots(fallback);
        const firstAvailable = fallback.find((slot) => slot.status === "available");
        setSelectedSlotId(firstAvailable?.id || "");
        setWarningText(
          "Live slots dekhne ke liye login karein. Abhi fallback slots dikhaye ja rahe hain."
        );
        return;
      }

      if (isFallbackPlan) {
        const fallback = buildFallbackSlots(selectedDate, selectedPlan, userTimeZone);
        if (!alive) return;
        setSlots(fallback);
        const firstAvailable = fallback.find((slot) => slot.status === "available");
        setSelectedSlotId(firstAvailable?.id || "");
        setWarningText(
          "Live slot plans load nahi ho paaye. Please login karke retry karein."
        );
        return;
      }

      setLoadingSlots(true);

      try {
        const response = await fetchAvailableSlots({
          date: selectedDate,
          planId: selectedPlan.id,
          authToken,
        });
        const data = response?.data?.data ?? response?.data ?? {};
        const timezone = String(data.timezone || "").trim();
        const normalized = normalizeSlots(safeArray(data.slots), selectedPlan, timezone);

        if (!alive) return;
        setSlots(normalized);
        const firstAvailable = normalized.find((slot) => slot.status === "available");
        setSelectedSlotId(firstAvailable?.id || "");
      } catch (error) {
        if (!alive) return;
        const fallback = buildFallbackSlots(selectedDate, selectedPlan, userTimeZone);
        setSlots(fallback);
        const firstAvailable = fallback.find((slot) => slot.status === "available");
        setSelectedSlotId(firstAvailable?.id || "");
        setWarningText(
          error?.response?.data?.message ||
            "Live slots load nahi ho paaye, fallback slots dikhaye ja rahe hain."
        );
      } finally {
        if (alive) {
          setLoadingSlots(false);
        }
      }
    };

    void loadSlots();

    return () => {
      alive = false;
    };
  }, [authToken, selectedDate, selectedPlan?.id, isFallbackPlan, userTimeZone]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  const selectedCount = slots.filter((slot) => slot.status === "available").length;
  const columns = useMemo(() => {
    if (width >= 1100) return 3;
    if (width >= 720) return 2;
    return 1;
  }, [width]);

  const cardWidth = columns === 3 ? "32%" : columns === 2 ? "49%" : "100%";

  const handlePlanPress = (plan) => {
    setSelectedPlanId(plan.id);
  };

  const handleSlotPress = (slot) => {
    if (slot.status !== "available") {
      Alert.alert("Unavailable", "Ye slot booked ya unavailable hai.");
      return;
    }

    setSelectedSlotId(slot.id);
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert("Select a slot", "Continue karne ke liye pehle ek available slot select karein.");
      return;
    }

    if (isFallbackPlan) {
      Alert.alert(
        "Login required",
        "Real booking continue karne ke liye active slot plan load hona chahiye. Please login karke page refresh karein."
      );
      return;
    }

    onContinue?.({
      date: selectedDate,
      dateLabel: formatLongDate(selectedDate),
      duration: selectedPlan.durationMinutes,
      planId: selectedPlan.id,
      planTitle: selectedPlan.title,
      slot: selectedSlot,
      timeRange: `${selectedSlot.startLabel} - ${selectedSlot.endLabel}`,
      price: selectedPlan.offerPrice,
      originalPrice: selectedPlan.basePrice,
      offerPercent: selectedPlan.offerPercent,
      consultationType,
      serviceName,
      timeZone: selectedSlot.timezone || userTimeZone,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.shell}>
        <LinearGradient colors={[Colors.gradientStart, Colors.accent]} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>

            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={styles.heroBadgeText}>Secure Booking</Text>
            </View>
          </View>

          <Text style={styles.kicker}>{consultationType} Booking</Text>
          <Text style={styles.title}>{serviceName}</Text>
          <Text style={styles.subtitle}>
            Select consultation date, choose duration, pick an available slot, then continue to payment.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Slots</Text>
              <Text style={styles.heroStatValue}>{slots.length}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Available</Text>
              <Text style={styles.heroStatValue}>{selectedCount}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Starting at</Text>
              <Text style={styles.heroStatValue}>{formatMoney(selectedPlan.offerPrice, selectedPlan.currency)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Select Consultation Date</Text>
              <Text style={styles.sectionSubtitle}>{formatLongDate(selectedDate)}</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map((date) => {
              const active = safeDateKey(date) === safeDateKey(selectedDate);
              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => setSelectedDate(date)}
                  style={({ pressed }) => [
                    styles.dateCard,
                    active && styles.dateCardActive,
                    pressed && styles.pressedCard,
                  ]}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>{formatDateLabel(date).slice(0, 3)}</Text>
                  <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{date.getDate()}</Text>
                  <Text style={[styles.dateMonth, active && styles.dateTextActive]}>
                    {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Choose Chat Duration</Text>
              <Text style={styles.sectionSubtitle}>Duration ke hisaab se price aur slots auto update honge.</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="hourglass-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.durationRow}>
            {(slotPlans.length ? slotPlans : FALLBACK_PLANS).map((plan) => {
              const active = selectedPlan?.id === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => handlePlanPress(plan)}
                  style={({ pressed }) => [
                    styles.durationCard,
                    active && styles.durationCardActive,
                    pressed && styles.pressedCard,
                  ]}
                >
                  <Text style={[styles.durationTitle, active && styles.durationTitleActive]}>{plan.durationMinutes} min</Text>
                  <Text style={[styles.durationPrice, active && styles.durationPriceActive]}>
                    {formatMoney(plan.offerPrice, plan.currency)}
                  </Text>
                  <View style={styles.offerRow}>
                    <Text style={[styles.originalPrice, active && styles.originalPriceActive]}>
                      {formatMoney(plan.basePrice, plan.currency)}
                    </Text>
                    <Text style={[styles.offerBadge, active && styles.offerBadgeActive]}>{plan.offerPercent}% OFF</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              <Text style={styles.sectionSubtitle}>Morning, afternoon aur evening icons ke saath slots dikh rahe hain.</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.timezoneBox}>
            <Ionicons name="globe-outline" size={16} color={Colors.primary} />
            <Text style={styles.timezoneText}>Showing in {userTimeZoneLabel}</Text>
          </View>

          <View style={styles.legendRow}>
            <Legend label="Morning" icon="sunny-outline" color="#E7A23B" />
            <Legend label="Afternoon" icon="partly-sunny-outline" color="#D97706" />
            <Legend label="Evening" icon="moon-outline" color="#7C3AED" />
          </View>

          {loadingPlans || loadingSlots ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>
                {loadingPlans ? "Plans load ho rahe hain..." : "Available slots load ho rahe hain..."}
              </Text>
            </View>
          ) : null}

          {warningText ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.warningText}>{warningText}</Text>
            </View>
          ) : null}

          <View style={styles.slotGrid}>
            {slots.map((slot, index) => {
              const active = slot.id === selectedSlotId;
              const locked = slot.status !== "available";
              const isLastInRow = (index + 1) % columns === 0;

              return (
                <Pressable
                  key={slot.id}
                  onPress={() => handleSlotPress(slot)}
                  disabled={locked}
                  style={({ pressed }) => [
                    styles.slotCard,
                    { width: cardWidth, marginRight: isLastInRow ? 0 : 10 },
                    active && styles.slotCardActive,
                    locked && styles.slotCardLocked,
                    pressed && !locked && styles.pressedCard,
                  ]}
                >
                  {active ? <View style={styles.slotSelectedGlow} /> : null}

                  <View style={styles.slotTopRow}>
                    <View style={[styles.slotIcon, active && styles.slotIconActive, locked && styles.slotIconLocked]}>
                      <Ionicons name={slot.periodIcon} size={18} color={active ? "#fff" : slot.periodColor} />
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        active && styles.statusBadgeActive,
                        locked && styles.statusBadgeLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          active && styles.statusBadgeTextActive,
                          locked && styles.statusBadgeTextLocked,
                        ]}
                      >
                        {slot.status === "available" ? "Available" : "Booked"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.slotTime, active && styles.slotTimeActive, locked && styles.slotTimeLocked]}>
                    {slot.startLabel}
                  </Text>
                  <Text style={[styles.slotPeriod, active && styles.slotPeriodActive, locked && styles.slotPeriodLocked]}>
                    {slot.period}
                  </Text>
                  <Text style={[styles.slotMeta, active && styles.slotMetaActive, locked && styles.slotMetaLocked]}>
                    Ends at {slot.endLabel}
                  </Text>

                  <View style={[styles.slotDivider, active && styles.slotDividerActive]} />

                  <Text style={[styles.slotPrice, active && styles.slotPriceActive, locked && styles.slotPriceLocked]}>
                    {formatMoney(slot.price, selectedPlan.currency)}
                  </Text>
                  <Text style={[styles.slotOriginal, active && styles.slotOriginalActive, locked && styles.slotOriginalLocked]}>
                    {formatMoney(slot.originalPrice, selectedPlan.currency)}
                  </Text>
                  <Text style={[styles.slotOffer, active && styles.slotOfferActive, locked && styles.slotOfferLocked]}>
                    {slot.offerPercent}% OFF
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.helperBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
            <Text style={styles.helperText}>
              {slots.some((slot) => slot.status === "available")
                ? "Booked ya unavailable slots select nahi honge."
                : "Is date ke liye koi available slot nahi hai. Agla date choose karein."}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Selected Summary</Text>
              <Text style={styles.sectionSubtitle}>Current booking ka complete overview.</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
            </View>
          </View>

          {selectedSlot ? (
            <View style={styles.summaryCard}>
              <SummaryItem label="Date" value={formatLongDate(selectedDate)} icon="calendar-outline" />
              <SummaryItem label="Duration" value={`${selectedPlan.durationMinutes} minutes`} icon="hourglass-outline" />
              <SummaryItem label="Time" value={`${selectedSlot.startLabel} - ${selectedSlot.endLabel}`} icon="time-outline" />
              <SummaryItem
                label="Price"
                value={formatMoney(selectedPlan.offerPrice, selectedPlan.currency)}
                extra={`${formatMoney(selectedPlan.basePrice, selectedPlan.currency)}  ${selectedPlan.offerPercent}% OFF`}
                icon="wallet-outline"
              />

              <View style={styles.selectedTagRow}>
                <View style={styles.selectedTag}>
                  <Ionicons name={selectedSlot.periodIcon} size={14} color={selectedSlot.periodColor} />
                  <Text style={styles.selectedTagText}>{selectedSlot.period}</Text>
                </View>
                <View style={styles.selectedTag}>
                  <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
                  <Text style={styles.selectedTagText}>
                    Save {formatMoney(selectedPlan.basePrice - selectedPlan.offerPrice, selectedPlan.currency)}
                  </Text>
                </View>
                <View style={styles.selectedTag}>
                  <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
                  <Text style={styles.selectedTagText}>{selectedPlan.title}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptySummary}>
              <Ionicons name="hand-left-outline" size={22} color={Colors.primary} />
              <Text style={styles.emptySummaryText}>Available slot select karte hi complete summary yahan show hogi.</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={!selectedSlot || loadingBooking || loadingSlots || loadingPlans}
          style={({ pressed }) => [
            styles.continueButton,
            (!selectedSlot || loadingBooking || loadingSlots || loadingPlans) && styles.continueButtonDisabled,
            pressed && selectedSlot && !loadingBooking && !loadingSlots && !loadingPlans && styles.continueButtonPressed,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.continueTitle}>
              {loadingBooking
                ? "Creating booking..."
                : selectedSlot
                  ? `Continue to Payment • ${formatMoney(selectedPlan.offerPrice, selectedPlan.currency)}`
                  : "Select a Time Slot"}
            </Text>
            <Text style={styles.continueSubtitle}>
              {loadingBooking
                ? "Please wait while we reserve your slot"
                : selectedSlot
                  ? `${selectedPlan.durationMinutes} min • ${selectedSlot.startLabel} - ${selectedSlot.endLabel}`
                  : "Payment page kholne ke liye slot choose karein"}
            </Text>
          </View>

          <View style={styles.continueArrow}>
            {loadingBooking ? (
              <Ionicons name="hourglass-outline" size={22} color={Colors.primary} />
            ) : (
              <Ionicons name="arrow-forward" size={22} color={Colors.primary} />
            )}
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const Legend = ({ label, icon, color }) => (
  <View style={styles.legendItem}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const SummaryItem = ({ label, value, extra, icon }) => (
  <View style={styles.summaryItem}>
    <View style={styles.summaryIcon}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
    </View>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {extra ? <Text style={styles.summaryExtra}>{extra}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  hero: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    ...Shadows.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  kicker: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 18,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 760,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  heroStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    padding: 12,
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "700",
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.gradientSoftStart,
    alignItems: "center",
    justifyContent: "center",
  },
  dateRow: {
    paddingBottom: 4,
    gap: 10,
  },
  dateCard: {
    width: 82,
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginRight: 8,
  },
  dateCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDay: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  dateNumber: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginVertical: 4,
  },
  dateMonth: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  dateTextActive: {
    color: "#fff",
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  durationCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    padding: 14,
  },
  durationCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  durationTitleActive: {
    color: "#fff",
  },
  durationPrice: {
    color: Colors.primary,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },
  durationPriceActive: {
    color: "#fff",
  },
  offerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  originalPrice: {
    color: Colors.textMuted,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  originalPriceActive: {
    color: "rgba(255,255,255,0.82)",
  },
  offerBadge: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  offerBadgeActive: {
    color: "#fff",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  loadingBox: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  warningBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "rgba(221,51,51,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  slotCard: {
    minHeight: 190,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  slotCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotCardLocked: {
    backgroundColor: "#F4ECE3",
    opacity: 0.9,
  },
  slotSelectedGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  slotTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: Colors.gradientSoftStart,
    alignItems: "center",
    justifyContent: "center",
  },
  slotIconActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  slotIconLocked: {
    backgroundColor: "#E8DDCF",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.gradientSoftStart,
  },
  statusBadgeActive: {
    backgroundColor: "#fff",
  },
  statusBadgeLocked: {
    backgroundColor: "#EFE3D7",
  },
  statusBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusBadgeTextActive: {
    color: Colors.primary,
  },
  statusBadgeTextLocked: {
    color: Colors.textMuted,
  },
  slotTime: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 12,
  },
  slotTimeActive: {
    color: "#fff",
  },
  slotTimeLocked: {
    color: Colors.textMuted,
  },
  slotPeriod: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  slotPeriodActive: {
    color: "#fff",
  },
  slotPeriodLocked: {
    color: Colors.textMuted,
  },
  slotMeta: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 5,
  },
  slotMetaActive: {
    color: "rgba(255,255,255,0.9)",
  },
  slotMetaLocked: {
    color: "#A89A91",
  },
  slotDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  slotDividerActive: {
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  slotPrice: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  slotPriceActive: {
    color: "#fff",
  },
  slotPriceLocked: {
    color: Colors.textMuted,
  },
  slotOriginal: {
    color: Colors.textMuted,
    fontSize: 11,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  slotOriginalActive: {
    color: "rgba(255,255,255,0.78)",
  },
  slotOriginalLocked: {
    color: "#A89A91",
  },
  slotOffer: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
  },
  slotOfferActive: {
    color: "#fff",
  },
  slotOfferLocked: {
    color: "#A89A91",
  },
  helperBox: {
    marginTop: 12,
    backgroundColor: Colors.gradientSoftStart,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  timezoneBox: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timezoneText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: Colors.gradientSoftStart,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  summaryExtra: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  selectedTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.gradientSoftStart,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTagText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  emptySummary: {
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.gradientSoftStart,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
  },
  emptySummaryText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "700",
  },
  continueButton: {
    minHeight: 66,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    ...Shadows.lg,
  },
  continueButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  continueTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  continueSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    marginTop: 4,
  },
  continueArrow: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  pressedCard: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
