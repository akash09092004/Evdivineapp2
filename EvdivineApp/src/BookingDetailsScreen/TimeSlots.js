import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  background: "#FFF3D5",
  card: "#FFF9EF",
  white: "#FFFFFF",

  primary: "#BC612A",
  primaryDark: "#8E3F19",
  primaryLight: "#F9E2C4",

  text: "#482213",
  textSecondary: "#936348",

  success: "#15D96F",
  successDark: "#079B4B",
  successLight: "#E7FFF2",

  danger: "#E74747",
  dangerLight: "#FFECEC",

  warning: "#FF9F1C",
  warningLight: "#FFF3D8",

  border: "#EBCFB8",
  divider: "#EBD3BF",
};

const DURATION_PLANS = [
  {
    id: "duration_20",
    duration: 20,
    title: "Quick Chat",
    price: 8,
    originalPrice: 10,
    discount: 20,
    badge: "QUICK",
    description: "Best for one quick question",
  },
  {
    id: "duration_40",
    duration: 40,
    title: "Standard Chat",
    price: 14,
    originalPrice: 20,
    discount: 30,
    badge: "POPULAR",
    description: "Best for detailed discussion",
    popular: true,
  },
  {
    id: "duration_60",
    duration: 60,
    title: "Premium Chat",
    price: 20,
    originalPrice: 30,
    discount: 33,
    badge: "BEST VALUE",
    description: "Best for complete consultation",
  },
];

const BOOKED_TIMES = [
  "10:40 AM",
  "01:00 PM",
  "04:20 PM",
  "06:00 PM",
];

const padNumber = (number) => String(number).padStart(2, "0");

const convertMinutesToTime = (totalMinutes) => {
  const normalizedMinutes = totalMinutes % (24 * 60);
  const hour24 = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${padNumber(hour12)}:${padNumber(minute)} ${period}`;
};

const convertTimeToMinutes = (time) => {
  const [timePart, period] = time.split(" ");
  const [hourString, minuteString] = timePart.split(":");

  let hour = Number(hourString);
  const minute = Number(minuteString);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getSlotPeriod = (time) => {
  const minutes = convertTimeToMinutes(time);

  if (minutes < 12 * 60) return "Morning";
  if (minutes < 17 * 60) return "Afternoon";
  return "Evening";
};

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

const getPeriodIcon = (time) => {
  const period = getSlotPeriod(time);

  if (period === "Morning") {
    return {
      name: "sunny-outline",
      emoji: "🌅",
    };
  }

  if (period === "Afternoon") {
    return {
      name: "sunny",
      emoji: "☀️",
    };
  }

  return {
    name: "moon-outline",
    emoji: "🌙",
  };
};

const generateSlots = ({
  startTime = "09:00 AM",
  endTime = "08:00 PM",
  duration = 20,
}) => {
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);

  const generatedSlots = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes + duration <= endMinutes;
    currentMinutes += duration
  ) {
    const start = convertMinutesToTime(currentMinutes);
    const end = convertMinutesToTime(currentMinutes + duration);

    generatedSlots.push({
      id: `${duration}_${currentMinutes}`,
      startTime: start,
      endTime: end,
      duration,
      period: getSlotPeriod(start),
      available: !BOOKED_TIMES.includes(start),
      status: BOOKED_TIMES.includes(start)
        ? "booked"
        : "available",
    });
  }

  return generatedSlots;
};

const getDateList = (numberOfDays = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return date;
  });
};

export default function TimeSlots({
  onSelect,
  onContinue,
  initialDuration = 20,
  initialDate = new Date(),
  startTime = "09:00 AM",
  endTime = "08:00 PM",
  numberOfDates = 7,
}) {
  const { width } = useWindowDimensions();
  const userTimeZone = useMemo(() => getUserTimeZone(), []);
  const userTimeZoneLabel = useMemo(() => getTimeZoneLabel(userTimeZone), [userTimeZone]);

  const [selectedDate, setSelectedDate] = useState(
    new Date(initialDate)
  );

  const [selectedDuration, setSelectedDuration] =
    useState(initialDuration);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const dates = useMemo(
    () => getDateList(numberOfDates),
    [numberOfDates]
  );

  const selectedPlan = useMemo(
    () =>
      DURATION_PLANS.find(
        (plan) => plan.duration === selectedDuration
      ) || DURATION_PLANS[0],
    [selectedDuration]
  );

  const slots = useMemo(
    () =>
      generateSlots({
        startTime,
        endTime,
        duration: selectedDuration,
      }),
    [startTime, endTime, selectedDuration]
  );

  const numberOfColumns = width >= 1000 ? 3 : width >= 650 ? 3 : 2;
  const gridGap = 12;

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedDuration]);

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available) {
      Alert.alert(
        "Slot unavailable",
        "This slot is already booked. Please select another slot."
      );
      return;
    }

    setSelectedSlot(slot);

    onSelect?.({
      date: selectedDate,
      duration: selectedDuration,
      plan: selectedPlan,
      slot,
      price: selectedPlan.price,
    });
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert(
        "Select time slot",
        "Please select an available consultation slot."
      );
      return;
    }

    onContinue?.({
      date: selectedDate,
      duration: selectedDuration,
      plan: selectedPlan,
      slot: selectedSlot,
      price: selectedPlan.price,
    });
  };

  return (
    <View style={styles.container}>
      {/* Heading */}

      <View style={styles.topHeader}>
        <View>
          <Text style={styles.mainTitle}>Select Time</Text>

          <Text style={styles.mainSubtitle}>
            Choose date, duration and preferred slot
          </Text>
        </View>

        <View style={styles.timezoneBadge}>
          <View style={styles.timezoneDot} />

          <Text style={styles.timezoneText}>{userTimeZoneLabel}</Text>
        </View>
      </View>

      {/* Date Selector */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Select Consultation Date
          </Text>

          <Text style={styles.sectionSubtitle}>
            Choose your preferred date
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <Ionicons
            name="calendar-outline"
            size={21}
            color={COLORS.primary}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      >
        {dates.map((date, index) => {
          const active =
            date.toDateString() === selectedDate.toDateString();

          const isToday = index === 0;

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => handleDateSelect(date)}
              style={({ pressed }) => [
                styles.dateCard,
                active && styles.activeDateCard,
                pressed && styles.pressedCard,
              ]}
            >
              {isToday && (
                <View
                  style={[
                    styles.todayBadge,
                    active && styles.activeTodayBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.todayText,
                      active && styles.activeTodayText,
                    ]}
                  >
                    TODAY
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.dateDay,
                  active && styles.activeDateText,
                ]}
              >
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </Text>

              <Text
                style={[
                  styles.dateNumber,
                  active && styles.activeDateText,
                ]}
              >
                {date.getDate()}
              </Text>

              <Text
                style={[
                  styles.dateMonth,
                  active && styles.activeDateText,
                ]}
              >
                {date.toLocaleDateString("en-US", {
                  month: "short",
                })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Duration Plans */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Choose Chat Duration
          </Text>

          <Text style={styles.sectionSubtitle}>
            Select 20, 40 or 60 minutes
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <Ionicons
            name="hourglass-outline"
            size={21}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.durationWrapper}>
        {DURATION_PLANS.map((plan) => {
          const active =
            selectedDuration === plan.duration;

          return (
            <Pressable
              key={plan.id}
              onPress={() =>
                handleDurationSelect(plan.duration)
              }
              style={({ pressed }) => [
                styles.durationCard,
                active && styles.activeDurationCard,
                pressed && styles.pressedCard,
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>
                    MOST POPULAR
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.durationIcon,
                  active && styles.activeDurationIcon,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={19}
                  color={
                    active ? COLORS.white : COLORS.primary
                  }
                />
              </View>

              <Text
                style={[
                  styles.durationValue,
                  active && styles.activeDurationText,
                ]}
              >
                {plan.duration}
              </Text>

              <Text
                style={[
                  styles.durationUnit,
                  active && styles.activeDurationText,
                ]}
              >
                Minutes
              </Text>

              <Text
                style={[
                  styles.planTitle,
                  active && styles.activeDurationText,
                ]}
              >
                {plan.title}
              </Text>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.offerPrice,
                    active && styles.activeDurationText,
                  ]}
                >
                  ${plan.price}
                </Text>

                <Text
                  style={[
                    styles.originalPrice,
                    active && styles.activeOriginalPrice,
                  ]}
                >
                  ${plan.originalPrice}
                </Text>
              </View>

              <View
                style={[
                  styles.discountBadge,
                  active && styles.activeDiscountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.discountText,
                    active && styles.activeDiscountText,
                  ]}
                >
                  {plan.discount}% OFF
                </Text>
              </View>

              <Text
                style={[
                  styles.planDescription,
                  active && styles.activePlanDescription,
                ]}
                numberOfLines={2}
              >
                {plan.description}
              </Text>

              <View
                style={[
                  styles.radioCircle,
                  active && styles.activeRadioCircle,
                ]}
              >
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={COLORS.primary}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Plan Offer */}

      <View style={styles.offerBanner}>
        <View style={styles.offerIconBox}>
          <Ionicons
            name="pricetag"
            size={21}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>
            {selectedPlan.discount}% Discount Applied
          </Text>

          <Text style={styles.offerDescription}>
            You save $
            {selectedPlan.originalPrice - selectedPlan.price} on{" "}
            {selectedPlan.duration} minutes consultation
          </Text>
        </View>

        <Text style={styles.offerAmount}>
          ${selectedPlan.price}
        </Text>
      </View>

      {/* Time Slots */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Available Time Slots
          </Text>

          <Text style={styles.sectionSubtitle}>
            Slots are {selectedDuration} minutes each
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <Ionicons
            name="time-outline"
            size={22}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.slotLegend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              styles.availableLegendDot,
            ]}
          />

          <Text style={styles.legendText}>Available</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              styles.selectedLegendDot,
            ]}
          />

          <Text style={styles.legendText}>Selected</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              styles.bookedLegendDot,
            ]}
          />

          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      <View style={styles.slotWrapper}>
        {slots.map((slot, index) => {
          const active = selectedSlot?.id === slot.id;
          const periodIcon = getPeriodIcon(slot.startTime);

          const isLastInRow =
            (index + 1) % numberOfColumns === 0;

          return (
            <TouchableOpacity
              key={slot.id}
              activeOpacity={slot.available ? 0.82 : 1}
              disabled={!slot.available}
              onPress={() => handleSlotSelect(slot)}
              style={[
                styles.slot,
                {
                  width:
                    numberOfColumns === 3
                      ? "32%"
                      : "48.5%",
                  marginRight: isLastInRow ? 0 : gridGap,
                },
                active && styles.activeSlot,
                !slot.available && styles.bookedSlot,
              ]}
            >
              {/* Decorative selected design */}

              {active && (
                <>
                  <View style={styles.selectedDecorationOne} />
                  <View style={styles.selectedDecorationTwo} />
                </>
              )}

              <View
                style={[
                  styles.slotPeriodIcon,
                  active && styles.activeSlotIcon,
                  !slot.available && styles.bookedSlotIcon,
                ]}
              >
                <Text style={styles.slotEmoji}>
                  {periodIcon.emoji}
                </Text>
              </View>

              <Text
                style={[
                  styles.slotStartTime,
                  active && styles.activeSlotText,
                  !slot.available && styles.bookedSlotText,
                ]}
              >
                {slot.startTime.split(" ")[0]}
              </Text>

              <Text
                style={[
                  styles.slotPeriodText,
                  active && styles.activeSlotText,
                  !slot.available && styles.bookedSlotText,
                ]}
              >
                {slot.startTime.split(" ")[1]}
              </Text>

              <Text
                style={[
                  styles.slotEndTime,
                  active && styles.activeSlotEndTime,
                  !slot.available && styles.bookedSlotText,
                ]}
              >
                Ends at {slot.endTime}
              </Text>

              <View
                style={[
                  styles.slotDivider,
                  active && styles.activeSlotDivider,
                ]}
              />

              <View style={styles.slotStatusRow}>
                {active ? (
                  <View style={styles.selectedCheck}>
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={COLORS.primary}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusDot,
                      slot.available
                        ? styles.availableDot
                        : styles.bookedDot,
                    ]}
                  />
                )}

                <Text
                  style={[
                    styles.slotStatusText,
                    slot.available
                      ? styles.availableText
                      : styles.bookedText,
                    active && styles.activeStatusText,
                  ]}
                >
                  {active
                    ? "Selected"
                    : slot.available
                      ? "Available"
                      : "Booked"}
                </Text>
              </View>

              {!slot.available && (
                <View style={styles.bookedBadge}>
                  <Text style={styles.bookedBadgeText}>
                    UNAVAILABLE
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selection Summary */}

      {selectedSlot && (
        <View style={styles.selectedSummary}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryCheck}>
              <Ionicons
                name="checkmark"
                size={21}
                color={COLORS.white}
              />
            </View>

            <View style={styles.summaryHeaderContent}>
              <Text style={styles.summaryTitle}>
                Consultation Selected
              </Text>

              <Text style={styles.summarySubtitle}>
                Review your selected schedule
              </Text>
            </View>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryLabel}>Date</Text>

                <Text style={styles.summaryValue}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons
                name="time-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryLabel}>Time</Text>

                <Text style={styles.summaryValue}>
                  {selectedSlot.startTime} -{" "}
                  {selectedSlot.endTime}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryLabel}>
                  Duration
                </Text>

                <Text style={styles.summaryValue}>
                  {selectedDuration} minutes
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons
                name="wallet-outline"
                size={18}
                color={COLORS.primary}
              />

              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryLabel}>Price</Text>

                <View style={styles.summaryPriceRow}>
                  <Text style={styles.summaryOfferPrice}>
                    ${selectedPlan.price}
                  </Text>

                  <Text style={styles.summaryOriginalPrice}>
                    ${selectedPlan.originalPrice}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.savingBox}>
            <Ionicons
              name="sparkles"
              size={18}
              color={COLORS.successDark}
            />

            <Text style={styles.savingText}>
              You are saving $
              {selectedPlan.originalPrice - selectedPlan.price}{" "}
              with this offer
            </Text>
          </View>
        </View>
      )}

      {/* Continue Button */}

      <Pressable
        disabled={!selectedSlot}
        onPress={handleContinue}
        style={({ pressed }) => [
          styles.continueButton,
          !selectedSlot && styles.disabledContinueButton,
          pressed &&
            selectedSlot &&
            styles.pressedContinueButton,
        ]}
      >
        <View>
          <Text style={styles.continueButtonTitle}>
            {selectedSlot
              ? `Continue • $${selectedPlan.price}`
              : "Select a Time Slot"}
          </Text>

          <Text style={styles.continueButtonSubtitle}>
            {selectedSlot
              ? `${selectedDuration} min • ${selectedSlot.startTime}`
              : "Choose an available slot to continue"}
          </Text>
        </View>

        <View style={styles.continueArrowBox}>
          <Ionicons
            name="arrow-forward"
            size={21}
            color={COLORS.primary}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderRadius: 26,
    padding: 18,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 23,
  },

  mainTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },

  mainSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  timezoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  timezoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: 7,
  },

  timezoneText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  dateList: {
    paddingBottom: 20,
    gap: 10,
  },

  dateCard: {
    position: "relative",
    width: 75,
    minHeight: 102,
    backgroundColor: COLORS.card,
    borderRadius: 19,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  activeDateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  todayBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  activeTodayBadge: {
    backgroundColor: COLORS.white,
  },

  todayText: {
    color: COLORS.warning,
    fontSize: 7,
    fontWeight: "900",
  },

  activeTodayText: {
    color: COLORS.primary,
  },

  dateDay: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  dateNumber: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginVertical: 4,
  },

  dateMonth: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  activeDateText: {
    color: COLORS.white,
  },

  durationWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },

  durationCard: {
    position: "relative",
    flex: 1,
    minWidth: 105,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 16,
    overflow: "hidden",
  },

  activeDurationCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  popularBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning,
    alignItems: "center",
    paddingVertical: 4,
  },

  popularText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  durationIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  activeDurationIcon: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  durationValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },

  durationUnit: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  planTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 7,
    textAlign: "center",
  },

  activeDurationText: {
    color: COLORS.white,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  offerPrice: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: "900",
  },

  originalPrice: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textDecorationLine: "line-through",
    marginLeft: 5,
  },

  activeOriginalPrice: {
    color: "#F4CEB8",
  },

  discountBadge: {
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 6,
  },

  activeDiscountBadge: {
    backgroundColor: COLORS.white,
  },

  discountText: {
    color: COLORS.successDark,
    fontSize: 8,
    fontWeight: "900",
  },

  activeDiscountText: {
    color: COLORS.primary,
  },

  planDescription: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    lineHeight: 12,
    textAlign: "center",
    marginTop: 7,
  },

  activePlanDescription: {
    color: "#FBE0D1",
  },

  radioCircle: {
    position: "absolute",
    right: 9,
    bottom: 9,
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  activeRadioCircle: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },

  offerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningLight,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F4D6A0",
    padding: 13,
    marginBottom: 18,
  },

  offerIconBox: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  offerContent: {
    flex: 1,
    marginLeft: 10,
  },

  offerTitle: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: "900",
  },

  offerDescription: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  offerAmount: {
    color: COLORS.primaryDark,
    fontSize: 21,
    fontWeight: "900",
  },

  slotLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 14,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },

  availableLegendDot: {
    backgroundColor: COLORS.success,
  },

  selectedLegendDot: {
    backgroundColor: COLORS.primary,
  },

  bookedLegendDot: {
    backgroundColor: COLORS.danger,
  },

  legendText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: "700",
  },

  slotWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  slot: {
    position: "relative",
    minHeight: 178,
    backgroundColor: COLORS.card,
    borderRadius: 21,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 14,
    marginBottom: 12,
    overflow: "hidden",
  },

  activeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  bookedSlot: {
    backgroundColor: "#F3ECE5",
    borderColor: "#E4D6CB",
    opacity: 0.75,
  },

  selectedDecorationOne: {
    position: "absolute",
    width: 150,
    height: 90,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -35,
    right: -55,
  },

  selectedDecorationTwo: {
    position: "absolute",
    width: 180,
    height: 65,
    borderRadius: 60,
    backgroundColor: "rgba(112,39,10,0.30)",
    bottom: -30,
    left: -50,
    transform: [{ rotate: "-8deg" }],
  },

  slotPeriodIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  activeSlotIcon: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  bookedSlotIcon: {
    backgroundColor: "#E7DDD5",
  },

  slotEmoji: {
    fontSize: 20,
  },

  slotStartTime: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 9,
    zIndex: 2,
  },

  slotPeriodText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
    zIndex: 2,
  },

  slotEndTime: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "600",
    marginTop: 5,
    zIndex: 2,
  },

  activeSlotText: {
    color: COLORS.white,
  },

  activeSlotEndTime: {
    color: "#FCE0D0",
  },

  bookedSlotText: {
    color: "#A89A91",
  },

  slotDivider: {
    width: "78%",
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 11,
    zIndex: 2,
  },

  activeSlotDivider: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  slotStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  availableDot: {
    backgroundColor: COLORS.success,
  },

  bookedDot: {
    backgroundColor: COLORS.danger,
  },

  selectedCheck: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  slotStatusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  availableText: {
    color: COLORS.success,
  },

  bookedText: {
    color: COLORS.danger,
  },

  activeStatusText: {
    color: COLORS.white,
  },

  bookedBadge: {
    position: "absolute",
    top: 10,
    right: -30,
    width: 115,
    alignItems: "center",
    backgroundColor: COLORS.danger,
    paddingVertical: 4,
    transform: [{ rotate: "35deg" }],
  },

  bookedBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  selectedSummary: {
    backgroundColor: COLORS.card,
    borderRadius: 21,
    borderWidth: 1.3,
    borderColor: COLORS.border,
    padding: 15,
    marginTop: 4,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryCheck: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryHeaderContent: {
    flex: 1,
    marginLeft: 10,
  },

  summaryTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  summarySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  summaryDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    gap: 10,
  },

  summaryItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 10,
  },

  summaryItemContent: {
    flex: 1,
    marginLeft: 7,
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },

  summaryPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  summaryOfferPrice: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },

  summaryOriginalPrice: {
    color: COLORS.textSecondary,
    fontSize: 9,
    textDecorationLine: "line-through",
    marginLeft: 5,
  },

  savingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successLight,
    borderRadius: 13,
    padding: 10,
    marginTop: 12,
  },

  savingText: {
    flex: 1,
    color: COLORS.successDark,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 7,
  },

  continueButton: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    borderRadius: 19,
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 11,
    elevation: 5,
  },

  disabledContinueButton: {
    opacity: 0.48,
    shadowOpacity: 0,
    elevation: 0,
  },

  pressedContinueButton: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  continueButtonTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  continueButtonSubtitle: {
    color: "#FBE1D2",
    fontSize: 9.5,
    marginTop: 3,
  },

  continueArrowBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
