import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LinearGradient from "../components/LinearGradient";
import PayPalCheckoutButton from "../components/PayPalCheckoutButton";
import ResponsiveScreen from "../components/ResponsiveScreen";
import { Colors, Shadows } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import {
  captureWalletPayPalOrder,
  getWalletBalance,
  getWalletPlans,
  getWalletTransactions,
  createWalletPayPalOrder,
} from "../Services/walletApi";

const QUICK_AMOUNTS = [199, 500, 1000, 2000];

const formatUSD = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const toDateLabel = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const normalizeTransactions = (payload) => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? [];
  return Array.isArray(data) ? data : [];
};

const Wallet = ({ navigation }) => {
  const { authReady, authToken, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isTablet = width >= 720;
  const isCompact = width < 380;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceData, setBalanceData] = useState({
    balance: 0,
    lowWalletAlertThreshold: 100,
    isLowBalance: true,
  });
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [amount, setAmount] = useState("500");
  const selectedPlanIdRef = useRef("");
  const paypalButtonRef = useRef(null);

  const loadWalletData = useCallback(async () => {
    if (!authReady) return;

    if (!isAuthenticated || !authToken) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [balanceResponse, plansResponse, txResponse] = await Promise.all([
        getWalletBalance({ authToken }),
        getWalletPlans({ authToken }),
        getWalletTransactions({ authToken }),
      ]);

      const nextBalance =
        balanceResponse?.data?.data || balanceResponse?.data || {};
      const nextPlans = plansResponse?.data?.data ?? plansResponse?.data ?? [];
      const nextTransactions = normalizeTransactions(txResponse);

      setBalanceData({
        balance: Number(nextBalance.balance || 0),
        lowWalletAlertThreshold: Number(
          nextBalance.lowWalletAlertThreshold || 100
        ),
        isLowBalance: Boolean(nextBalance.isLowBalance),
      });
      setPlans(Array.isArray(nextPlans) ? nextPlans : []);
      setTransactions(nextTransactions);

      const defaultPlan =
        (Array.isArray(nextPlans) &&
          nextPlans.find((item) => item.isPopular)) ||
        (Array.isArray(nextPlans) ? nextPlans[0] : null);

      if (defaultPlan && !selectedPlanIdRef.current) {
        setSelectedPlanId(defaultPlan._id);
        setAmount(String(defaultPlan.amount || 500));
      }
    } catch (error) {
      Alert.alert(
        "Wallet load failed",
        error?.response?.data?.message ||
          error?.message ||
          "Wallet data load nahi ho paya."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authReady, authToken, isAuthenticated]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  useEffect(() => {
    selectedPlanIdRef.current = selectedPlanId;
  }, [selectedPlanId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("Home");
  };

  const openLogin = () => {
    navigation?.navigate?.("Login", {
      redirectTo: "Wallet",
    });
  };

  const pickPlan = (plan) => {
    setSelectedPlanId(plan._id);
    setAmount(String(plan.amount || ""));
  };

  const pickQuickAmount = (value) => {
    setSelectedPlanId("");
    setAmount(String(value));
  };

  const activePlan = useMemo(
    () => plans.find((item) => item._id === selectedPlanId),
    [plans, selectedPlanId]
  );

  const rechargeAmountValue = useMemo(() => {
    if (selectedPlanId) {
      return Number(activePlan?.amount || amount || 0);
    }

    return Number(amount || 0);
  }, [activePlan?.amount, amount, selectedPlanId]);

  const walletPayPalMeta = useMemo(
    () => ({
      source: "wallet",
      rechargeType: selectedPlanId ? "plan" : "custom",
      planId: selectedPlanId || "",
      planName: activePlan?.name || "",
    }),
    [activePlan?.name, selectedPlanId]
  );

  const handleWalletRechargeSuccess = useCallback(async () => {
    Alert.alert(
      "Wallet recharged",
      "PayPal payment successfully complete ho gaya."
    );
    setSelectedPlanId("");
    setAmount("500");
    await loadWalletData();
  }, [loadWalletData]);

  const handleWalletRechargeError = useCallback((error) => {
    Alert.alert(
      "Recharge failed",
      error?.response?.data?.message ||
        error?.message ||
        "Wallet recharge complete nahi ho saka."
    );
  }, []);

  const walletPayPalCreateOrder = useCallback(
    async ({
      returnUrl,
      cancelUrl,
      purpose = "wallet_recharge",
      meta = {},
      referenceId = "",
      authToken: requestAuthToken = "",
    }) => {
      if (!authReady) {
        throw new Error("Login state load ho raha hai.");
      }

      if (!isAuthenticated || !(requestAuthToken || authToken)) {
        throw new Error("Wallet recharge ke liye login zaroori hai.");
      }

      if (
        !selectedPlanId &&
        (!Number.isFinite(rechargeAmountValue) || rechargeAmountValue <= 0)
      ) {
        throw new Error("Recharge amount sahi enter karein.");
      }

      if (selectedPlanId && !activePlan) {
        throw new Error("Selected recharge plan available nahi hai.");
      }

      const response = await createWalletPayPalOrder({
        amount: rechargeAmountValue,
        planId: selectedPlanId,
        currency: "USD",
        purpose,
        meta: {
          ...walletPayPalMeta,
          ...meta,
        },
        referenceId,
        returnUrl,
        cancelUrl,
        authToken: requestAuthToken || authToken,
      });

      return response;
    },
    [
      activePlan,
      authReady,
      authToken,
      isAuthenticated,
      rechargeAmountValue,
      selectedPlanId,
    ]
  );

  const walletPayPalCaptureOrder = useCallback(
    async ({ orderId, payerId = "", authToken: requestAuthToken = "" } = {}) =>
      captureWalletPayPalOrder({
        orderId,
        payerId,
        authToken: requestAuthToken || authToken,
      }),
    [authToken]
  );

  const heroStatusLabel = balanceData.isLowBalance
    ? "Low balance"
    : "Healthy balance";
  const heroStatusColor = balanceData.isLowBalance ? "#F97316" : "#16A34A";

  return (
    <ResponsiveScreen backgroundColor={Colors.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[
              styles.scrollContent,
              isWide && styles.scrollContentWide,
            ]}
          >
            <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]}>
              <View style={styles.hero}>
                <View style={styles.heroTopRow}>
                  <Pressable style={styles.heroBack} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                  </Pressable>

                  <View style={styles.heroTitleWrap}>
                    <Text style={styles.heroKicker}>Wallet</Text>
                    <Text
                      style={[
                        styles.heroTitle,
                        isCompact && styles.heroTitleCompact,
                      ]}
                    >
                      Recharge and track balance
                    </Text>
                  </View>

                  <Pressable style={styles.heroBack} onPress={onRefresh}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.heroStatsRow,
                    !isWide && styles.heroStatsStack,
                  ]}
                >
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current balance</Text>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.balanceValue}>
                        {formatUSD(balanceData.balance)}
                      </Text>
                    )}
                    <Text style={styles.balanceMeta}>
                      Low wallet threshold{" "}
                      {formatUSD(balanceData.lowWalletAlertThreshold)}
                    </Text>
                  </View>

                  <View style={styles.statusCard}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: heroStatusColor },
                      ]}
                    />
                    <Text style={styles.statusLabel}>{heroStatusLabel}</Text>
                    <Text style={styles.statusSub}>
                      {balanceData.isLowBalance
                        ? "Recharge karo taaki services uninterrupted chalti rahen."
                        : "Aapka wallet abhi healthy hai."}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => paypalButtonRef.current?.startPayment?.()}
                      disabled={loading}
                    >
                      <Ionicons name="logo-paypal" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>
                        Recharge with PayPal
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {!isAuthenticated ? (
              <View style={styles.authCard}>
                <Text style={styles.sectionTitle}>Login</Text>
                <Text style={styles.sectionText}>
                  Wallet dekhne ke liye login.
                </Text>
                <Pressable style={styles.loginButton} onPress={openLogin}>
                  <Text style={styles.loginButtonText}>Go to Login</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Plans</Text>
                  <Text style={styles.sectionText}>Pick a plan.</Text>
                </View>
                <Text style={styles.sectionBadge}>{plans.length} plans</Text>
              </View>

              {loading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    Plans load ho rahe hain...
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.planGrid,
                    isWide && styles.planGridWide,
                    isTablet && styles.planGridTablet,
                  ]}
                >
                  {plans.map((plan) => {
                    const selected = selectedPlanId === plan._id;
                    return (
                      <Pressable
                        key={plan._id}
                        onPress={() => pickPlan(plan)}
                        style={({ pressed }) => [
                          styles.planCard,
                          isWide && styles.planCardWide,
                          isTablet && styles.planCardTablet,
                          selected && styles.planCardActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        {plan.isPopular ? (
                          <Text style={styles.popularTag}>Popular</Text>
                        ) : null}
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planAmount}>
                          {formatUSD(plan.amount)}
                        </Text>
                        <Text style={styles.planBonus}>
                          +{formatUSD(plan.bonusAmount || 0)} bonus
                        </Text>
                        <Text style={styles.planDesc} numberOfLines={2}>
                          {plan.description || "Recharge plan"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Amount</Text>
                  <Text style={styles.sectionText}>Set recharge amount.</Text>
                </View>
              </View>

              <View
                style={[styles.amountShell, isWide && styles.amountShellWide]}
              >
                <View style={styles.amountInputWrap}>
                  <Text style={styles.inputLabel}>Recharge amount</Text>
                  <View style={styles.amountInputRow}>
                    <Text style={styles.currencyMark}>$</Text>
                    <TextInput
                      value={amount}
                      onChangeText={(value) => {
                        setSelectedPlanId("");
                        setAmount(value.replace(/[^0-9]/g, ""));
                      }}
                      placeholder="500"
                      keyboardType="numeric"
                      placeholderTextColor="#8B5F49"
                      style={styles.amountInput}
                    />
                  </View>
                </View>

                <View style={styles.quickChips}>
                  {QUICK_AMOUNTS.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => pickQuickAmount(value)}
                      style={({ pressed }) => [
                        styles.quickChip,
                        amount === String(value) && styles.quickChipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.quickChipText}>
                        {formatUSD(value)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <PayPalCheckoutButton
                  ref={paypalButtonRef}
                  amount={rechargeAmountValue || 0}
                  currency="USD"
                  purpose="wallet_recharge"
                  meta={walletPayPalMeta}
                  referenceId={
                    selectedPlanId
                      ? `wallet_plan_${selectedPlanId}`
                      : "wallet_custom"
                  }
                  createOrderRequest={walletPayPalCreateOrder}
                  captureOrderRequest={walletPayPalCaptureOrder}
                  buttonLabel="Pay with PayPal"
                  showAlerts={false}
                  onPaymentSuccess={handleWalletRechargeSuccess}
                  onPaymentError={handleWalletRechargeError}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>History</Text>
                  <Text style={styles.sectionText}>
                    Latest wallet activity.
                  </Text>
                </View>
                <Text style={styles.sectionBadge}>
                  {transactions.length} items
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    Transactions load ho rahe hain...
                  </Text>
                </View>
              ) : transactions.length ? (
                <View style={styles.txList}>
                  {transactions.map((tx) => {
                    const amountValue = Number(tx.amount || 0);
                    const isCredit =
                      amountValue >= 0 &&
                      String(tx.type || tx.purpose || "")
                        .toLowerCase()
                        .includes("credit");
                    const txColor = isCredit ? "#16A34A" : "#A34B1F";

                    return (
                      <View
                        key={tx._id || tx.id || `${tx.createdAt}-${tx.amount}`}
                        style={styles.txCard}
                      >
                        <View
                          style={[
                            styles.txIcon,
                            { backgroundColor: `${txColor}18` },
                          ]}
                        >
                          <Ionicons
                            name={
                              isCredit
                                ? "arrow-down-circle-outline"
                                : "arrow-up-circle-outline"
                            }
                            size={22}
                            color={txColor}
                          />
                        </View>

                        <View style={styles.txBody}>
                          <View style={styles.txTopRow}>
                            <Text style={styles.txTitle}>
                              {tx.type || tx.purpose || "Wallet transaction"}
                            </Text>
                            <Text style={[styles.txAmount, { color: txColor }]}>
                              {amountValue >= 0 ? "+" : "-"}
                              {formatUSD(Math.abs(amountValue))}
                            </Text>
                          </View>

                          <Text style={styles.txMeta} numberOfLines={1}>
                            {toDateLabel(tx.createdAt)}
                          </Text>

                          <View style={styles.txMetaRow}>
                            <Text style={styles.txMetaSmall}>
                              Balance after:{" "}
                              {formatUSD(tx.balanceAfter || tx.balance || 0)}
                            </Text>
                            <Text style={styles.txMetaSmall}>
                              {tx.status || "success"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="time-outline"
                    size={26}
                    color={Colors.primary}
                  />
                  <Text style={styles.emptyTitle}>No transactions yet</Text>
                  <Text style={styles.emptyText}>
                    Recharge ya wallet spend hone ke baad history yahan dikhegi.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ResponsiveScreen>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  scrollContentWide: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1160,
  },
  hero: {
    padding: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Shadows.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitleWrap: {
    flex: 1,
  },
  heroKicker: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
    fontFamily: "serif",
  },
  heroTitleCompact: {
    fontSize: 20,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  heroStatsStack: {
    flexDirection: "column",
  },
  balanceCard: {
    flex: 1.2,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 8,
    fontFamily: "serif",
  },
  balanceMeta: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  statusCard: {
    flex: 1,
    backgroundColor: "rgba(255,247,233,0.92)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusLabel: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  statusSub: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "serif",
  },
  sectionText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  sectionBadge: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "rgba(163,75,31,0.10)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: "hidden",
  },
  authCard: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  loginButton: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  planGridWide: {
    gap: 14,
  },
  planGridTablet: {
    justifyContent: "space-between",
  },
  planCard: {
    flexGrow: 1,
    flexBasis: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 152,
    ...Shadows.card,
  },
  planCardTablet: {
    flexBasis: "48%",
  },
  planCardWide: {
    flexBasis: "31.5%",
  },
  planCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF5EA",
  },
  popularTag: {
    alignSelf: "flex-start",
    color: "#fff",
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 10,
    overflow: "hidden",
  },
  planName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  planAmount: {
    color: Colors.primary,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 8,
    fontFamily: "serif",
  },
  planBonus: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  planDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  amountShell: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  amountShellWide: {
    padding: 18,
  },
  amountInputWrap: {
    marginBottom: 14,
  },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  currencyMark: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 54,
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(163,75,31,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
  },
  quickChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickChipText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  rechargeButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rechargeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  planHint: {
    marginTop: 10,
    color: Colors.textMuted,
    fontSize: 12,
  },
  orderInfo: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(163,75,31,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,75,31,0.10)",
  },
  orderInfoLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  orderInfoValue: {
    marginTop: 4,
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  txList: {
    gap: 10,
  },
  txCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    ...Shadows.card,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txBody: {
    flex: 1,
  },
  txTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  txTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "900",
  },
  txMeta: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 12,
  },
  txMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  txMetaSmall: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyCard: {
    minHeight: 160,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
