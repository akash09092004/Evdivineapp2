import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { navigate, navigationRef } from "../navigation/navigationRef";

export default function UserChatAccessListener() {
  const { authToken } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!authToken) {
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

    socket.on("chat:access-updated", (payload) => {
      if (payload?.status === "approved") {
        const currentRoute = navigationRef.getCurrentRoute?.();
        const currentRouteName = currentRoute?.name || "";
        if (currentRouteName === "ChatSession" || currentRouteName === "Chat") {
          return;
        }
        navigate("ChatSession");
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
