import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { navigate } from "../navigation/navigationRef";

const LOW_WALLET_TYPES = new Set(["wallet", "low_wallet", "wallet_low"]);

export default function UserNotificationListener() {
  const { authToken } = useAuth();
  const socketRef = useRef(null);
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!authToken) {
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      seenRef.current.clear();
      return undefined;
    }

    const socket = io(API_BASE_URL, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      forceNew: true,
    });

    socketRef.current = socket;

    const showWalletAlert = (notification) => {
      const notificationId = String(notification?._id || "");
      if (notificationId && seenRef.current.has(notificationId)) {
        return;
      }
      if (notificationId) {
        seenRef.current.add(notificationId);
      }

      const title = notification?.title || "Wallet alert";
      const body =
        notification?.body ||
        "Wallet balance low hai. Recharge karke services continue rakhein.";

      Alert.alert(title, body, [
        { text: "OK", style: "cancel" },
        {
          text: "Add Money",
          onPress: () => {
            navigate("PaymentMethods");
          },
        },
      ]);
    };

    socket.on("notification:new", (notification) => {
      if (!notification) return;

      const type = String(notification?.type || "").toLowerCase();
      if (LOW_WALLET_TYPES.has(type)) {
        showWalletAlert(notification);
      }
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [authToken]);

  useEffect(
    () => () => {
      socketRef.current?.disconnect?.();
    },
    []
  );

  return null;
}
