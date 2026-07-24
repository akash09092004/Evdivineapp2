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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  endBookedChat,
  getBookedChatMessages,
  joinBookedChat,
  sendBookedChatMessage,
} from "../Services/bookingApi";

const POLL_INTERVAL_MS = 5000;
const BOOKING_JOIN_BEFORE_MINUTES = 5;
const BOOKING_JOIN_GRACE_MINUTES = 10;

const formatTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const pad2 = (value) => String(Math.max(0, Number(value || 0))).padStart(2, "0");

const formatDurationClock = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  return `${pad2(minutes)}:${pad2(seconds)}`;
};

const getBookingJoinWindow = (booking) => {
  const startAt = new Date(booking?.startAt || 0).getTime();
  const endAt = new Date(booking?.endAt || 0).getTime();

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    return {
      open: false,
      windowStart: 0,
      windowEnd: 0,
    };
  }

  return {
    open:
      Date.now() >= startAt - BOOKING_JOIN_BEFORE_MINUTES * 60 * 1000 &&
      Date.now() <= endAt + BOOKING_JOIN_GRACE_MINUTES * 60 * 1000,
    windowStart: startAt - BOOKING_JOIN_BEFORE_MINUTES * 60 * 1000,
    windowEnd: endAt + BOOKING_JOIN_GRACE_MINUTES * 60 * 1000,
  };
};

const extractFileName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = raw.startsWith("http") ? new URL(raw) : null;
    const pathValue = url ? url.pathname : raw;
    const lastPart = pathValue.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(lastPart);
  } catch {
    const lastPart = raw.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(lastPart);
  }
};

const normalizeMessage = (message) => {
  const author = message?.senderRole === "admin" ? "admin" : "user";
  const text = String(message?.text || "").trim();
  const mediaUrl = String(message?.mediaUrl || "").trim();
  const messageType = String(message?.type || "text").trim() || "text";

  if (!text && !mediaUrl && !message?.transcription) {
    return null;
  }

  return {
    id: String(message?.id || message?._id || `${Date.now()}-${Math.random()}`),
    text,
    type: author,
    messageType,
    mediaUrl,
    createdAt: message?.createdAt || message?.updatedAt || null,
    senderName: message?.senderName || "",
  };
};

const mergeIncomingMessage = (current, incoming) => {
  const next = normalizeMessage(incoming);
  if (!next) return current;

  const index = current.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    const copy = [...current];
    copy[index] = next;
    return copy;
  }

  return [...current, next];
};

const loadVoiceModule = () => {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const mod = require("@react-native-voice/voice");
    return mod?.default || mod || null;
  } catch (error) {
    console.log("[ChatSession] voice module unavailable", error?.message || error);
    return null;
  }
};

const loadWebSpeechRecognition = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function ChatSession({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { authToken, authReady, isAuthenticated } = useAuth();
  const listRef = useRef(null);
  const voiceRef = useRef(null);
  const webSpeechRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [session, setSession] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [userName, setUserName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [chatAccessStatus, setChatAccessStatus] = useState("none");
  const [chatAccessReason, setChatAccessReason] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [chatBilling, setChatBilling] = useState({
    freeSeconds: 300,
    ratePerMinute: 0,
    elapsedSeconds: 0,
    remainingFreeSeconds: 300,
    requiresWallet: false,
    chargeAmount: 1,
  });
  const [listening, setListening] = useState(false);
  const [speechHint, setSpeechHint] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [walletPopupVisible, setWalletPopupVisible] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [authRedirecting, setAuthRedirecting] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const socketRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const effectiveStatus = session?.status || chatAccessStatus || "none";
  const bookingChatMode = Boolean(currentBooking?._id);
  const bookingWindow = getBookingJoinWindow(currentBooking);
  const bookingStatus = String(currentBooking?.bookingStatus || "").toLowerCase();
  const bookedSessionStatus = String(session?.status || "").toLowerCase();
  const isChatActive = bookingChatMode
    ? bookingWindow.open &&
      [
        "confirmed",
        "ready",
        "waiting_for_admin",
        "in_progress",
        "active",
      ].includes(bookingStatus || bookedSessionStatus)
    : ["approved", "active"].includes(effectiveStatus);
  const hasSession = Boolean(session?._id);
  const canShowThread = hasSession || isChatActive;
  const composerBusy = sending || uploadingAttachment;

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (isAuthenticated && authToken) {
      setAuthRedirecting(false);
      return;
    }

    setAuthRedirecting(true);
    const timer = setTimeout(() => {
      navigation?.navigate?.("Login", {
        redirectTo: "Chat",
        redirectParams: route?.params || {},
        successMessage:
          "Chat access ke liye pehle login ya sign up karein.",
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [authReady, authToken, isAuthenticated, navigation, route?.params]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const voice = loadVoiceModule();
    voiceRef.current = voice;

    if (!voice) {
      return undefined;
    }

    voice.onSpeechStart = () => {
      setListening(true);
      setSpeechHint("Listening...");
    };

    voice.onSpeechEnd = () => {
      setListening(false);
      setSpeechHint("");
    };

    voice.onSpeechError = (event) => {
      setListening(false);
      const message =
        event?.error?.message || event?.error || "Voice recognition failed";
      setSpeechHint("");
      Alert.alert("Mic error", String(message));
    };

    voice.onSpeechResults = (event) => {
      const best = event?.value?.[0]?.trim?.() || "";
      if (best) {
        setText((prev) => {
          const next = prev.trim();
          return next ? `${next} ${best}` : best;
        });
      }
      setListening(false);
      setSpeechHint("");
    };

    voice.onSpeechPartialResults = (event) => {
      const partial = event?.value?.[0]?.trim?.() || "";
      if (partial) {
        setSpeechHint(partial);
      }
    };

    return () => {
      try {
        voice.destroy?.().catch?.(() => {});
      } catch {}
      try {
        voice.removeAllListeners?.();
      } catch {}
      if (voiceRef.current === voice) {
        voiceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return undefined;
    }

    const SpeechRecognition = loadWebSpeechRecognition();
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setSpeechHint("Listening...");
    };

    recognition.onend = () => {
      setListening(false);
      setSpeechHint("");
    };

    recognition.onerror = (event) => {
      setListening(false);
      setSpeechHint("");
      const message =
        event?.error === "not-allowed"
          ? "Microphone permission denied"
          : event?.error || "Voice recognition failed";
      Alert.alert("Mic error", String(message));
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim?.() || "";
        if (!transcript) continue;

        if (result.isFinal) {
          finalText = finalText ? `${finalText} ${transcript}` : transcript;
        } else {
          interimText = interimText ? `${interimText} ${transcript}` : transcript;
        }
      }

      if (finalText) {
        setText((prev) => {
          const next = prev.trim();
          return next ? `${next} ${finalText}` : finalText;
        });
      }

      setSpeechHint(interimText || "");
    };

    webSpeechRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
      if (webSpeechRef.current === recognition) {
        webSpeechRef.current = null;
      }
    };
  }, []);

  const ensureMicPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message:
            "Evdivine ko voice message ke liye microphone permission chahiye.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
          buttonNeutral: "Ask me later",
        }
      );

      const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
      setPermissionGranted(ok);
      return ok;
    } catch (error) {
      console.log("[ChatSession] permission error", error?.message || error);
      return false;
    }
  }, []);

  const loadChat = useCallback(async ({ silent = false } = {}) => {
    if (!authReady) return;

    if (!authToken) {
      if (!silent) {
        setLoading(false);
      }
      setMessages([]);
      setSession(null);
      setSessions([]);
      setChatAccessStatus("none");
      setWalletBalance(0);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      const [statusResponse, sessionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/chat/status`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${API_BASE_URL}/api/users/chat/sessions`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      const statusData = await statusResponse.json();
      const sessionsData = await sessionsResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData?.message || "Unable to load chat status");
      }

      const nextStatus = statusData?.data?.chatAccessStatus || "none";
      const nextReason = statusData?.data?.chatAccessReason || "";
      const sessionList = Array.isArray(sessionsData?.data)
        ? sessionsData.data
        : [];
      const nextUserName = String(statusData?.data?.userName || "").trim();
      const nextBooking = statusData?.data?.booking || null;
      const nextWalletBalance = Number(statusData?.data?.walletBalance || 0);
      const nextChatBilling = statusData?.data?.chatBilling || {
        freeSeconds: 300,
        ratePerMinute: 0,
        elapsedSeconds: 0,
        remainingFreeSeconds: 300,
        requiresWallet: false,
        chargeAmount: 1,
      };
      const bookingSession =
        nextBooking?._id &&
        sessionList.find(
          (item) =>
            String(item?.bookingId || "") === String(nextBooking?._id || "")
        );
      const preferredSession =
        bookingSession ||
        statusData?.data?.session ||
        sessionList.find((item) =>
          ["approved", "active", "pending", "waiting", "in_progress", "ready"].includes(item?.status)
        ) ||
        sessionList[0] ||
        null;

      setChatAccessStatus(nextStatus);
      setChatAccessReason(nextReason);
      setUserName(nextUserName);
      setCurrentBooking(nextBooking);
      setWalletBalance(nextWalletBalance);
      setChatBilling(nextChatBilling);
      setSessions(sessionList);
      setSession(preferredSession);

      if (nextBooking?._id) {
        const bookingSessionStatus = String(bookingSession?.status || "").toLowerCase();
        const bookingStatusNow = String(nextBooking?.bookingStatus || "").toLowerCase();
        const bookingWindowOpen = getBookingJoinWindow(nextBooking).open;
        const needsJoin =
          bookingWindowOpen &&
          ![
            "waiting",
            "active",
            "in_progress",
            "completed",
            "cancelled",
            "expired",
            "waiting_for_admin",
          ].includes(bookingSessionStatus) &&
          ["confirmed", "ready"].includes(bookingStatusNow);

        if (needsJoin) {
          try {
            const joinResponse = await joinBookedChat({
              bookingId: nextBooking._id,
              authToken,
            });
            const joinData = joinResponse?.data?.data || joinResponse?.data || {};
            const joinedBooking = joinData?.booking || nextBooking;
            const joinedChat = joinData?.chat || preferredSession || bookingSession || null;

            setCurrentBooking(joinedBooking);
            if (joinedChat?._id) {
              setSession(joinedChat);
            }
          } catch (joinError) {
            console.log(
              "[ChatSession] joinBookedChat failed",
              joinError?.message || joinError
            );
          }
        }

        try {
          const messagesResponse = await getBookedChatMessages({
            bookingId: nextBooking._id,
            authToken,
          });
          const messagesData = messagesResponse?.data?.data || messagesResponse?.data || {};
          const items = Array.isArray(messagesData?.messages)
            ? messagesData.messages.map(normalizeMessage).filter(Boolean)
            : [];
          setMessages(items);
          const liveSession = messagesData?.chat || preferredSession || bookingSession || null;
          if (liveSession?._id) {
            setSession(liveSession);
          }
          if (messagesData?.booking?._id) {
            setCurrentBooking(messagesData.booking);
          }
          if (liveSession?.status) {
            setChatAccessStatus(String(liveSession.status).toLowerCase());
          }
        } catch (threadError) {
          console.log(
            "[ChatSession] booked messages load failed",
            threadError?.message || threadError
          );
          setMessages([]);
        }
      } else if (preferredSession?._id) {
        const threadKey = preferredSession._id || preferredSession.chatroomId;
        const threadResponse = await fetch(
          `${API_BASE_URL}/api/users/chat/sessions/${threadKey}/messages`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        const threadData = await threadResponse.json();

        if (threadResponse.ok) {
          const items = Array.isArray(threadData?.data?.messages)
            ? threadData.data.messages.map(normalizeMessage).filter(Boolean)
            : [];
          setMessages(items);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.log("[ChatSession] loadChat failed", error?.message || error);
      setMessages([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [authReady, authToken]);

  useEffect(() => {
    if (!authToken || !session?._id) {
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      return undefined;
    }

    const socket = io(API_BASE_URL, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit(
        "chat:join",
        {
          sessionId: session._id,
          chatroomId: session.chatroomId || "",
        },
        () => {}
      );
    });

    socket.on("chat:new-message", (payload) => {
      if (
        payload?.sessionId &&
        String(payload.sessionId) !== String(session._id)
      ) {
        return;
      }
      if (payload?.message) {
        setMessages((prev) => mergeIncomingMessage(prev, payload.message));
      }
    });

    socket.on("chat:session-updated", (payload) => {
      if (payload?.session) {
        setSession((prev) => ({
          ...(prev || {}),
          ...payload.session,
        }));
      }
    });

    socket.on("chat:access-updated", (payload) => {
      if (payload?.session) {
        setSession((prev) => ({
          ...(prev || {}),
          ...payload.session,
        }));
      }
      if (payload?.status) {
        setChatAccessStatus(payload.status);
      }
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [authToken, session?._id, session?.chatroomId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useFocusEffect(
    useCallback(() => {
      loadChat();
      if (!authToken) return undefined;

      const timer = setInterval(() => {
        if (canShowThread) {
          loadChat({ silent: true });
        }
      }, POLL_INTERVAL_MS);

      return () => clearInterval(timer);
    }, [authToken, canShowThread, loadChat])
  );

  useEffect(() => {
    if (listRef.current && messages.length) {
      setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated: true });
      }, 50);
    }
  }, [messages]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate("MainTabs", { screen: "Booking" });
  };

  const openPaymentMethods = () => {
    if (currentBooking?._id) {
      navigation?.navigate?.("PaymentMethods", {
        bookingId: currentBooking._id,
        amount: Number(currentBooking.finalAmount || slotRateAmount || 0),
        currency: slotRateCurrency,
        purpose: "booking",
        consultationType: "Chat",
        consultationDate: formatTime(
          currentBooking.startAt ||
            session?.startedAt ||
            session?.approvedAt ||
            session?.requestedAt
        ),
        consultationTime: `${bookedDurationMinutes || 0} min`,
        consultationRoute: "Chat",
        bookingNumber: currentBooking.bookingNumber || "",
      });
      return;
    }

    const amount = Math.max(1, Number(chatBilling?.chargeAmount || 1));
    navigation?.navigate?.("PaymentMethods", {
      amount,
      currency: "USD",
      purpose: "wallet_recharge",
      consultationType: "Chat",
      consultationDate: formatTime(
        session?.startedAt || session?.approvedAt || session?.requestedAt
      ),
      consultationTime: session?.chatroomId || "",
      consultationRoute: "Chat",
    });
  };

  const handleEndChat = () => {
    const targetBookingId = String(
      currentBooking?._id || session?.bookingId || ""
    ).trim();

    if (!session?._id && !targetBookingId) {
      Alert.alert("No chat", "End karne ke liye active chat session nahi mila.");
      return;
    }

    Alert.alert(
      "End Chat",
      "Kya aap sach me is chat ko end karna chahte ho?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Chat",
          style: "destructive",
          onPress: async () => {
            try {
              if (targetBookingId) {
                await endBookedChat({
                  bookingId: targetBookingId,
                  reason: "Ended by user",
                  authToken,
                });
              } else {
                const response = await fetch(
                  `${API_BASE_URL}/api/users/chat/sessions/${session._id}/end`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ reason: "Ended by user" }),
                  }
                );
                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data?.message || "Chat end failed");
                }
              }

              setMessages([]);
              setText("");
              setChatAccessStatus("completed");
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "completed",
                      endedAt: new Date().toISOString(),
                    }
                  : prev
              );
              setCurrentBooking((prev) =>
                prev
                  ? {
                      ...prev,
                      bookingStatus: "completed",
                    }
                  : prev
              );
              await loadChat();
              navigation?.navigate?.("MainTabs", { screen: "Booking" });
              Alert.alert("Chat ended", "Aapki chat successfully end ho gayi.");
            } catch (error) {
              const message = String(error?.message || "");
              if (
                message.includes("already completed") ||
                message.includes("not active")
              ) {
                setMessages([]);
                setText("");
                setChatAccessStatus("completed");
                setSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "completed",
                        endedAt: new Date().toISOString(),
                      }
                    : prev
                );
                setCurrentBooking((prev) =>
                  prev
                    ? {
                        ...prev,
                        bookingStatus: "completed",
                      }
                    : prev
                );
                navigation?.navigate?.("MainTabs", { screen: "Booking" });
                Alert.alert(
                  "Chat ended",
                  "Chat pehle se end thi, screen close kar di gayi."
                );
                return;
              }

              Alert.alert("Error", message || "Chat end nahi ho payi.");
            }
          },
        },
      ]
    );
  };

  const requestChat = async () => {
    if (!authToken) {
      navigation?.navigate("Login", {
        redirectTo: "Chat",
        successMessage: "Please login to request chat access.",
      });
      return;
    }

    try {
      setRequesting(true);
      const response = await fetch(`${API_BASE_URL}/api/users/chat/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Chat request failed");
      }

      await loadChat();
      Alert.alert(
        "Chat request sent",
        "Admin approval ke baad chat start hoga."
      );
    } catch (error) {
      Alert.alert("Error", error?.message || "Chat request failed");
    } finally {
      setRequesting(false);
    }
  };

  const submitMessage = async ({
    messageText = "",
    type = "text",
    mediaUrl = "",
    metadata = {},
  } = {}) => {
    const targetBookingId = String(
      currentBooking?._id || session?.bookingId || ""
    ).trim();
    if (!session?._id && !targetBookingId) return false;
    if (!isChatActive) {
      Alert.alert(
        "Chat not active",
        bookingChatMode
          ? "Booked slot start hone aur join window open hone ke baad hi message bhej paoge."
          : "Chat tabhi send hoga jab admin approve karega."
      );
      return false;
    }

    if (
      chatBilling?.requiresWallet &&
      walletBalance < Number(chatBilling?.chargeAmount || 1)
    ) {
      Alert.alert(
        "Wallet required",
        "Recharge karne ke baad hi chat continue kar paoge.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Money",
            onPress: () => navigation?.navigate("PaymentMethods"),
          },
        ]
      );
      return false;
    }

    const trimmedText = String(messageText || "").trim();
    if (type === "text" && !trimmedText) {
      return false;
    }

    let data = null;
    if (targetBookingId) {
      const bookedResponse = await sendBookedChatMessage({
        bookingId: targetBookingId,
        message: trimmedText,
        authToken,
      });
      data = bookedResponse?.data || null;
    } else {
      const response = await fetch(
        `${API_BASE_URL}/api/users/chat/sessions/${session._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            text: trimmedText,
            type,
            mediaUrl,
            transcription: "",
            metadata,
          }),
        }
      );
      data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Message send failed");
      }
    }

    const nextMessage = data?.data?.message || data?.data;
    if (nextMessage) {
      setMessages((prev) => mergeIncomingMessage(prev, nextMessage));
    }
    if (data?.data?.chat) {
      setSession((prev) => ({
        ...(prev || {}),
        ...data.data.chat,
        lastMessageAt: new Date().toISOString(),
      }));
    } else {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: data?.data?.status || prev.status,
              lastMessageAt: new Date().toISOString(),
            }
          : prev
      );
    }
    return true;
  };

  const sendMessage = async () => {
    const value = text.trim();
    if (!value) return;

    try {
      setSending(true);
      const ok = await submitMessage({
        messageText: value,
        type: "text",
        mediaUrl: "",
        metadata: {},
      });
      if (ok) {
        setText("");
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const uploadChatFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file, file.name || `chat-file-${Date.now()}`);

    const response = await fetch(`${API_BASE_URL}/api/users/chat/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "File upload failed");
    }
    return data?.data || {};
  };

  const pickWebFile = (accept) =>
    new Promise((resolve, reject) => {
      if (Platform.OS !== "web" || typeof document === "undefined") {
        reject(
          new Error("This upload button is currently available on web only.")
        );
        return;
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        resolve(file);
      };
      input.onerror = () => reject(new Error("Unable to open file picker"));
      input.click();
    });

  const handleAttachment = async (kind) => {
    if (!authToken || !session?._id) return;

    if (bookingChatMode) {
      Alert.alert(
        "Attachments unavailable",
        "Booked chat abhi text-only mode me hai. Please message type karo."
      );
      return;
    }

    const accept = kind === "image" ? "image/*" : "*/*";
    try {
      const file = await pickWebFile(accept);
      if (!file) return;

      setUploadingAttachment(true);
      const upload = await uploadChatFile(file);
      const messageType =
        kind === "image" || String(upload?.mimeType || "").startsWith("image/")
          ? "image"
          : "file";

      await submitMessage({
        messageText: file.name || upload?.fileName || "",
        type: messageType,
        mediaUrl: upload?.mediaUrl || "",
        metadata: {
          fileName: file.name || upload?.fileName || "",
          mimeType: file.type || upload?.mimeType || "",
          size: Number(file.size || upload?.size || 0),
        },
      });
    } catch (error) {
      Alert.alert(
        "Upload error",
        error?.message || "Unable to send attachment"
      );
    } finally {
      setUploadingAttachment(false);
    }
  };

  const toggleListening = async () => {
    if (!isChatActive) {
      Alert.alert(
        "Chat not active",
        "Mic use karne se pehle chat approval chahiye."
      );
      return;
    }

    if (Platform.OS === "web") {
      try {
        const SpeechRecognition = loadWebSpeechRecognition();
        const recognition =
          webSpeechRef.current || (SpeechRecognition ? new SpeechRecognition() : null);

        if (!recognition) {
          Alert.alert(
            "Voice unavailable",
            "Is browser me speech recognition support nahi hai. Chrome use karo ya keyboard use karo."
          );
          return;
        }

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        if (listening) {
          recognition.stop?.();
          return;
        }

        webSpeechRef.current = recognition;
        recognition.start?.();
        return;
      } catch (error) {
        setListening(false);
        setSpeechHint("");
        Alert.alert("Mic error", error?.message || "Unable to start voice input");
        return;
      }
    }

    if (Platform.OS !== "android") {
      Alert.alert(
        "Voice input unavailable",
        "This device/platform does not support voice recognition in the current build."
      );
      return;
    }

    try {
      const voice = voiceRef.current || loadVoiceModule();
      if (!voice) {
        Alert.alert(
          "Voice unavailable",
          "Voice module load nahi hua. Development build try karo."
        );
        return;
      }

      const hasPermission = permissionGranted || (await ensureMicPermission());
      if (!hasPermission) {
        Alert.alert("Permission required", "Microphone permission allow karo.");
        return;
      }

      if (listening) {
        await voice.stop?.();
        setListening(false);
        return;
      }

      const available = await voice.isAvailable?.();
      if (available === false) {
        Alert.alert(
          "Voice unavailable",
          "Is device par speech recognition available nahi hai. Custom build aur device speech engine check karo."
        );
        return;
      }

      setSpeechHint("Listening...");
      await voice.start?.("en-IN");
      setListening(true);
    } catch (error) {
      setListening(false);
      setSpeechHint("");
      Alert.alert("Mic error", error?.message || "Unable to start voice input");
    }
  };

  const openSession = useCallback(
    async (item) => {
      if (!item?._id) return;

      setSession(item);

      try {
        setLoading(true);
        const isBookedThread = Boolean(item?.bookingId);
        const response = isBookedThread
          ? await getBookedChatMessages({
              bookingId: item.bookingId,
              authToken,
            })
          : await fetch(
              `${API_BASE_URL}/api/users/chat/sessions/${item._id}/messages`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            ).then(async (res) => ({ ok: res.ok, data: await res.json() }));

        if (isBookedThread) {
          const bookedPayload = response?.data?.data || response?.data || {};
          const items = Array.isArray(bookedPayload?.messages)
            ? bookedPayload.messages.map(normalizeMessage).filter(Boolean)
            : [];
          setMessages(items);
        } else {
          if (!response.ok) {
            throw new Error(response?.data?.message || "Unable to load messages");
          }

          const items = Array.isArray(response?.data?.messages)
            ? response.data.messages.map(normalizeMessage).filter(Boolean)
            : [];
          setMessages(items);
        }
        socketRef.current?.emit?.(
          "chat:join",
          {
            sessionId: item._id,
            chatroomId: item.chatroomId || "",
          },
          () => {}
        );
      } catch (error) {
        Alert.alert("Error", error?.message || "Could not open session");
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  const emptyState = useMemo(() => {
    if (!authReady || loading) {
      return {
        icon: "hourglass-outline",
        title: "Checking chat access",
        subtitle: "We are verifying your chat approval status.",
      };
    }

    if (!isAuthenticated || !authToken) {
      return {
        icon: "log-in-outline",
        title: "Login required",
        subtitle: "Chat start karne ke liye pehle login karo.",
        action: "Login",
      };
    }

    if (effectiveStatus === "rejected") {
      return {
        icon: "close-circle-outline",
        title: "Chat access rejected",
        subtitle:
          chatAccessReason || "The admin has rejected chat access for now.",
        action: "Request again",
      };
    }

    if (bookingChatMode && !bookingWindow.open) {
      return {
        icon: "time-outline",
        title: "Booked slot pending",
        subtitle:
          "Aapka slot booked hai. Chat 5 minute pehle open hogi, phir aap message bhej sakoge.",
      };
    }

    if (
      !hasSession ||
      effectiveStatus === "pending" ||
      effectiveStatus === "none"
    ) {
      return {
        icon: "time-outline",
        title: "Waiting for admin approval",
        subtitle:
          "Chat request bhejo. Admin approve karega, uske baad yahan se message bhej paoge.",
        action: requesting ? "Requesting..." : "Request Chat",
      };
    }

    return {
      icon: "chatbubble-ellipses-outline",
      title: "Start chatting",
      subtitle: "Type your message below and continue the conversation.",
    };
  }, [
    authReady,
    authToken,
    chatAccessReason,
    effectiveStatus,
    hasSession,
    bookingChatMode,
    bookingWindow.open,
    isAuthenticated,
    loading,
    requesting,
  ]);

  const sessionCountLabel = useMemo(() => {
    if (!sessions.length) return "";
    if (sessions.length === 1) return "1 session";
    return `${sessions.length} sessions`;
  }, [sessions.length]);

  const displayUserName = String(userName || "").trim() || "You";
  const bookedDurationMinutes = Number(
    currentBooking?.durationMinutes ||
      session?.durationMinutes ||
      Math.round(Number(chatBilling?.freeSeconds || 0) / 60) ||
      0
  );
  const sessionStartAt = new Date(
    session?.startedAt ||
      session?.approvedAt ||
      session?.requestedAt ||
      session?.createdAt ||
      Date.now()
  );
  const elapsedSeconds = Number.isNaN(sessionStartAt.getTime())
    ? 0
    : Math.max(0, Math.floor((nowTick - sessionStartAt.getTime()) / 1000));
  const bookedTotalSeconds = Math.max(0, bookedDurationMinutes * 60);
  const visibleElapsedSeconds = bookedTotalSeconds
    ? Math.min(elapsedSeconds, bookedTotalSeconds)
    : elapsedSeconds;
  const remainingSlotSeconds = bookedTotalSeconds
    ? Math.max(bookedTotalSeconds - elapsedSeconds, 0)
    : 0;
  const slotTimerLabel = bookedTotalSeconds
    ? `${formatDurationClock(visibleElapsedSeconds)} / ${formatDurationClock(
        bookedTotalSeconds
      )}`
    : formatDurationClock(elapsedSeconds);
  const slotRemainingLabel = bookedTotalSeconds
    ? `${formatDurationClock(remainingSlotSeconds)} left`
    : "Live";
  const slotRateAmount = Number(
    currentBooking?.finalAmount ||
      currentBooking?.offerPrice ||
      chatBilling?.chargeAmount ||
      0
  );
  const slotRateCurrency = String(
    currentBooking?.currency || "USD"
  ).toUpperCase();

  const chargeAmount = Number(chatBilling?.chargeAmount || 1);
  const composerEnabled =
    isChatActive &&
    (!chatBilling?.requiresWallet || walletBalance >= chargeAmount) &&
    !composerBusy;
  const remainingFreeLabel =
    chatBilling?.remainingFreeSeconds > 0
      ? `${Math.floor(chatBilling.remainingFreeSeconds / 60)}m ${
          chatBilling.remainingFreeSeconds % 60
        }s free left`
      : "Free chat ended";
  const freeTimeEnded = Number(chatBilling?.remainingFreeSeconds || 0) <= 0;
  const walletNeeded =
    isChatActive &&
    (chatBilling?.requiresWallet || freeTimeEnded) &&
    walletBalance < chargeAmount;

  useEffect(() => {
    if (!isChatActive) {
      setWalletPopupVisible(false);
      return;
    }

    setWalletPopupVisible(walletNeeded);
  }, [isChatActive, walletNeeded]);

  const renderMessage = ({ item }) => {
    const isUser = item.type === "user";
    const mediaType = String(item.messageType || "text");
    const mediaUrl = String(item.mediaUrl || "").trim();
    const fileName = extractFileName(mediaUrl) || item.text || "Attachment";
    return (
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.adminBubble]}
      >
        {!isUser ? (
          <Text style={styles.senderLabel}>{item.senderName || "Admin"}</Text>
        ) : null}
        {mediaType === "image" && mediaUrl ? (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : null}
        {mediaType === "file" && mediaUrl ? (
          <TouchableOpacity
            style={styles.fileCard}
            activeOpacity={0.85}
            onPress={() => {
              Alert.alert("Attachment", fileName);
            }}
          >
            <Ionicons
              name="document-attach-outline"
              size={18}
              color={isUser ? "#fff" : "#BFA7E6"}
            />
            <Text
              style={[
                styles.fileName,
                isUser ? styles.userText : styles.adminText,
              ]}
            >
              {fileName}
            </Text>
          </TouchableOpacity>
        ) : null}
        {item.text ? (
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userText : styles.adminText,
            ]}
          >
            {item.text}
          </Text>
        ) : null}
        {!!item.createdAt ? (
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        ) : null}
      </View>
    );
  };

  if (!authReady || authRedirecting || (!isAuthenticated && !authToken)) {
    return (
      <SafeAreaView style={styles.centerAuthState}>
        <StatusBar barStyle="light-content" backgroundColor="#2E160B" />
        <View style={styles.centerAuthCard}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.centerAuthTitle}>Login required</Text>
          <Text style={styles.centerAuthText}>
            Chat kholne ke liye pehle login ya sign up karna hoga.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInitialLoading = loading && !session && !sessions.length && !messages.length;

  if (!authReady || isInitialLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#2E160B" />
        <View style={styles.centerState}>
          <Ionicons name="hourglass-outline" size={44} color="#fff" />
          <Text style={styles.stateTitle}>Checking chat access</Text>
          <Text style={styles.stateText}>
            We are loading your chat session and messages.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (emptyState.action && !canShowThread) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#2E160B" />
        <View style={styles.centerState}>
          <Ionicons name={emptyState.icon} size={44} color="#fff" />
          <Text style={styles.stateTitle}>{emptyState.title}</Text>
          <Text style={styles.stateText}>{emptyState.subtitle}</Text>

          <TouchableOpacity
            style={styles.stateButton}
            onPress={effectiveStatus === "rejected" ? requestChat : requestChat}
            disabled={requesting}
          >
            <Text style={styles.stateButtonText}>
              {requesting ? "Please wait..." : emptyState.action}
            </Text>
          </TouchableOpacity>

          {isAuthenticated && authToken ? (
            <Text style={styles.stateNote}>{remainingFreeLabel}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 12 : 0}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#2E160B" />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Chat Consultation</Text>
            <Text style={styles.headerSub}>
              {isChatActive
                ? "You can message the admin now"
                : "Waiting for approval"}
            </Text>
            {!!sessionCountLabel ? (
              <Text style={styles.headerTiny}>{sessionCountLabel}</Text>
            ) : null}
          </View>

          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                isChatActive ? styles.statusDotLive : styles.statusDotWait,
              ]}
            />
            <Text style={styles.statusText}>{effectiveStatus}</Text>
          </View>
        </View>

        <View style={styles.profileStrip}>
          <View style={styles.profileStripHeader}>
            <View>
              <Text style={styles.profileStripTitle}>Welcome {displayUserName}</Text>
              <Text style={styles.profileStripSubtitle}>
                {currentBooking?._id
                  ? "Booked slot ka live timer"
                  : "Chat session timer"}
              </Text>
            </View>
            <View style={styles.profileStripBadge}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.profileStripBadgeText}>
                {bookedDurationMinutes ? `${bookedDurationMinutes} min slot` : "Live"}
              </Text>
            </View>
          </View>

          <View style={styles.profileStatsRow}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Username</Text>
              <Text style={styles.profileStatValue}>{displayUserName}</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Slot</Text>
              <Text style={styles.profileStatValue}>
                {bookedDurationMinutes ? `${bookedDurationMinutes} min` : "Open"}
              </Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Timer</Text>
              <Text style={styles.profileStatValue}>{slotTimerLabel}</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatLabel}>Rate Per Slot</Text>
              <Text style={styles.profileStatValue}>
                {slotRateCurrency} {slotRateAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.profileStripFooter}>
            <Text style={styles.profileStripFooterText}>
              Elapsed {formatDurationClock(visibleElapsedSeconds)} • Remaining {slotRemainingLabel}
            </Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.chatContent,
            messages.length === 0 && styles.chatContentEmpty,
            { paddingBottom: 24 + insets.bottom },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyThread}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="#BFA7E6"
              />
              <Text style={styles.emptyThreadTitle}>
                {canShowThread ? "No messages yet" : emptyState.title}
              </Text>
              <Text style={styles.emptyThreadText}>
                {canShowThread
                  ? "Aapka first message bhejo, conversation yahan start hogi."
                  : emptyState.subtitle}
              </Text>
            </View>
          }
          onRefresh={loadChat}
          refreshing={loading}
        />

        <View style={[styles.composer, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionPay]}
              onPress={openPaymentMethods}
            >
              <Ionicons name="card-outline" size={16} color="#fff" />
              <Text style={styles.quickActionText}>Pay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionBtn,
                styles.quickActionEnd,
                !session?._id && styles.disabledBtn,
              ]}
              onPress={handleEndChat}
              disabled={!session?._id}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.quickActionText}>End Chat</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.micBtn,
              listening && styles.micBtnActive,
              !composerEnabled && styles.disabledBtn,
            ]}
            onPress={toggleListening}
            disabled={!composerEnabled}
          >
            <Ionicons
              name={listening ? "mic" : "mic-outline"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.attachBtn,
              (!composerEnabled || uploadingAttachment) && styles.disabledBtn,
            ]}
            onPress={() => handleAttachment("image")}
            disabled={!composerEnabled || uploadingAttachment}
          >
            <Ionicons name="image-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.attachBtn,
              (!composerEnabled || uploadingAttachment) && styles.disabledBtn,
            ]}
            onPress={() => handleAttachment("file")}
            disabled={!composerEnabled || uploadingAttachment}
          >
            <Ionicons name="attach-outline" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={
                isChatActive
                  ? "Type your message..."
                  : "Chat approval ke baad message bhejo"
              }
              placeholderTextColor="#9C8FB9"
              value={text}
              onChangeText={setText}
              multiline
              editable={composerEnabled}
            />
            {!!speechHint ? (
              <Text style={styles.speechHint}>{speechHint}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!composerEnabled || composerBusy) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!composerEnabled || composerBusy}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Modal
          visible={walletPopupVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setWalletPopupVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.walletModal}>
              <View style={styles.walletModalBadge}>
                <Ionicons name="paper-plane-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.walletModalTitle}>Wallet needed</Text>
              <Text style={styles.walletModalText}>
                Free chat khatam ho gaya hai. Continue karne ke liye wallet
                balance add karo.
              </Text>

              <View style={styles.walletModalBox}>
                <Text style={styles.walletTitle}>Current Balance</Text>
                <Text style={styles.walletBalance}>
                  ₹{Number(walletBalance || 0).toFixed(2)}
                </Text>
                <Text style={styles.walletSubtitle}>
                  Required charge: ₹{chargeAmount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.walletModalActions}>
                <TouchableOpacity
                  style={styles.walletModalSecondary}
                  onPress={() => setWalletPopupVisible(false)}
                >
                  <Text style={styles.walletModalSecondaryText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.walletModalPrimary}
                  onPress={() => {
                    setWalletPopupVisible(false);
                    navigation?.navigate("PaymentMethods");
                  }}
                >
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <Text style={styles.walletModalPrimaryText}>Add Money</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "#2E160B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#2E160B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(168,85,247,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    color: "#B7A9DD",
    fontSize: 12,
    marginTop: 3,
  },
  headerTiny: {
    color: "#8F7EB8",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A0B3D",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotLive: {
    backgroundColor: "#22C55E",
  },
  statusDotWait: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    color: "#EADDFB",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
  },
  chatContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  walletCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#140A32",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletPreviewCard: {
    marginTop: 8,
    width: "100%",
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletTitle: {
    color: "#BFA7E6",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  walletBalance: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  walletSubtitle: {
    color: "#D8CFF3",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  walletButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  historyWrap: {
    paddingTop: 12,
  },
  profileStrip: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 2,
    borderRadius: 10,
    backgroundColor: "#0F2D66",
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  profileStripHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  profileStripTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  profileStripSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 7,
    marginTop: 1,
  },
  profileStripBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
  },
  profileStripBadgeText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "800",
  },
  profileStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 4,
  },
  profileStat: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 108,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  profileStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 6,
    fontWeight: "700",
  },
  profileStatValue: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 0,
  },
  profileStripFooter: {
    marginTop: 3,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  profileStripFooterText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 7,
    fontWeight: "700",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  historyTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  historyAction: {
    color: "#BFA7E6",
    fontSize: 12,
    fontWeight: "800",
  },
  historyList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  historyCard: {
    width: 150,
    borderRadius: 18,
    backgroundColor: "#1A0B3D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    marginRight: 10,
  },
  historyCardActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#C4B5FD",
  },
  historyCardTitle: {
    color: "#E9D5FF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  historyCardTitleActive: {
    color: "#fff",
  },
  historyCardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  historyCardTextActive: {
    color: "#fff",
  },
  historyCardMeta: {
    color: "#B7A9DD",
    fontSize: 11,
    marginTop: 8,
  },
  historyCardMetaActive: {
    color: "rgba(255,255,255,0.85)",
  },
  chatContentEmpty: {
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "84%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  adminBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1A0B3D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#7C3AED",
  },
  senderLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageImage: {
    width: "100%",
    minHeight: 180,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  adminText: {
    color: "#F5EAFF",
  },
  userText: {
    color: "#fff",
  },
  timeText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  emptyThread: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 10,
  },
  emptyThreadTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyThreadText: {
    color: "#CDBCE9",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#2E160B",
    position: "relative",
    paddingTop: 58,
  },
  quickActionsRow: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  quickActionBtn: {
    flex: 0,
    minWidth: 128,
    minHeight: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
  },
  quickActionPay: {
    backgroundColor: "#0F766E",
  },
  quickActionEnd: {
    backgroundColor: "#B91C1C",
  },
  quickActionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: "#DC2626",
  },
  disabledBtn: {
    opacity: 0.45,
  },
  inputBox: {
    flex: 1,
    backgroundColor: "#1A0B3D",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    color: "#fff",
    fontSize: 14,
    minHeight: 22,
    maxHeight: 100,
  },
  speechHint: {
    color: "#BFA7E6",
    fontSize: 11,
    marginTop: 6,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
    backgroundColor: "#2E160B",
  },
  stateTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: {
    color: "#D8CFF3",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  stateButton: {
    marginTop: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  stateButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  stateNote: {
    color: "#CDBCE9",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  centerAuthState: {
    flex: 1,
    backgroundColor: "#2E160B",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerAuthCard: {
    width: "100%",
    maxWidth: 360,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: 12,
  },
  centerAuthTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  centerAuthText: {
    color: "#D8CFF3",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,5,24,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  walletModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: "#160A36",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  walletModalBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  walletModalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  walletModalText: {
    color: "#D8CFF3",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  walletModalBox: {
    width: "100%",
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  walletModalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  walletModalSecondary: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  walletModalSecondaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  walletModalPrimary: {
    flex: 1.2,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    gap: 8,
  },
  walletModalPrimaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
});
