import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

const RINGTONE_SOURCE = require("../../ringtone.wav");

export default function AdminRequestAlertListener() {
  const socketRef = useRef(null);
  const soundRef = useRef(null);
  const mountedRef = useRef(true);
  const [adminToken, setAdminToken] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const stopRingtone = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;

    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {}

    try {
      await sound.unloadAsync();
    } catch {}
  }, []);

  const startRingtone = useCallback(async () => {
    if (soundRef.current) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const { sound } = await Audio.Sound.createAsync(RINGTONE_SOURCE, {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });

      soundRef.current = sound;
    } catch (error) {
      console.log(
        "[AdminRequestAlertListener] ringtone error",
        error?.message || error
      );
    }
  }, []);

  const syncPendingCount = useCallback(async (socketToken) => {
    if (!socketToken) {
      setPendingCount(0);
      return 0;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/chat-access-requests?status=pending`,
      {
        headers: {
          Authorization: `Bearer ${socketToken}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Unable to load pending requests");
    }

    const pending = Array.isArray(data?.data?.requests)
      ? data.data.requests
      : [];
    const nextCount = pending.length;
    setPendingCount(nextCount);
    return nextCount;
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const token = await AsyncStorage.getItem("adminToken");
      if (mountedRef.current) {
        setAdminToken(token || "");
      }
    };

    hydrate();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!adminToken) {
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      setPendingCount(0);
      stopRingtone();
      return undefined;
    }

    let active = true;
    const socket = io(API_BASE_URL, {
      auth: { token: adminToken },
      transports: ["websocket", "polling"],
      forceNew: true,
    });

    socketRef.current = socket;

    const refreshFromServer = async ({ stopNow = false } = {}) => {
      try {
        if (stopNow) {
          await stopRingtone();
        }
        await syncPendingCount(adminToken);
      } catch (error) {
        console.log(
          "[AdminRequestAlertListener] sync error",
          error?.message || error
        );
      }
    };

    socket.on("connect", () => refreshFromServer());
    socket.on("chat:request:new", () => refreshFromServer());
    socket.on("chat:request:accepted", () => refreshFromServer({ stopNow: true }));
    socket.on("chat:request:rejected", () => refreshFromServer({ stopNow: true }));
    socket.on("chat:request:cancelled", () => refreshFromServer({ stopNow: true }));
    socket.on("chat:request:expired", () => refreshFromServer({ stopNow: true }));

    const bootstrap = async () => {
      try {
        const count = await syncPendingCount(adminToken);
        if (active && count > 0) {
          await startRingtone();
        }
      } catch (error) {
        console.log(
          "[AdminRequestAlertListener] bootstrap error",
          error?.message || error
        );
      }
    };

    bootstrap();

    return () => {
      active = false;
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [adminToken, startRingtone, stopRingtone, syncPendingCount]);

  useEffect(() => {
    if (pendingCount > 0) {
      startRingtone();
    } else {
      stopRingtone();
    }
  }, [pendingCount, startRingtone, stopRingtone]);

  useEffect(() => {
    return () => {
      stopRingtone();
      socketRef.current?.disconnect?.();
    };
  }, [stopRingtone]);

  return null;
}
