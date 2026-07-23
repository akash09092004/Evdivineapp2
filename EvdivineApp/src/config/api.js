import Constants from "expo-constants";
import { Platform } from "react-native";

const normalizeUrl = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/$/, "").replace(/\/api$/, "");
};

const isPrivateDevHost = (host) => {
  if (!host) return false;

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "10.0.2.2" ||
    host.endsWith(".local") ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
  );
};

const extractExpoHost = () => {
  const rawHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.developer?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

  if (!rawHost || typeof rawHost !== "string") {
    return "";
  }

  const cleaned = rawHost
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^exp(s)?:\/\//i, "")
    .split("/")[0]
    .split("?")[0];

  const host = cleaned.split(":")[0].trim();
  if (!host || !isPrivateDevHost(host)) {
    return "";
  }

  return `http://${host}:5000`;
};

const getBaseUrl = () => {
  const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
  if (envUrl) return envUrl;

  // Keep web development deterministic so requests do not drift to the LAN IP.
  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }

  const expoHostUrl = extractExpoHost();
  if (expoHostUrl) {
    return expoHostUrl;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
};

export const API_BASE_URL = getBaseUrl();
