import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

let webAuthToken = null;
let webRefreshToken = null;

const canUseWebStorage = () =>
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined";

const authStorage = {
  getToken: async () => {
    if (canUseWebStorage()) {
      const stored = window.localStorage.getItem("authToken");
      if (stored) {
        webAuthToken = stored;
        return stored;
      }

      return webAuthToken;
    }

    return AsyncStorage.getItem("authToken");
  },
  getRefreshToken: async () => {
    if (canUseWebStorage()) {
      const stored = window.localStorage.getItem("refreshToken");
      if (stored) {
        webRefreshToken = stored;
        return stored;
      }

      return webRefreshToken;
    }

    return AsyncStorage.getItem("refreshToken");
  },
  setTokens: async (token, refreshToken = "") => {
    if (canUseWebStorage()) {
      webAuthToken = token;
      webRefreshToken = refreshToken || null;
      window.localStorage.setItem("authToken", token);
      if (refreshToken) {
        window.localStorage.setItem("refreshToken", refreshToken);
      } else {
        window.localStorage.removeItem("refreshToken");
      }
      return;
    }

    await AsyncStorage.setItem("authToken", token);
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    } else {
      await AsyncStorage.removeItem("refreshToken");
    }
  },
  clearTokens: async () => {
    if (canUseWebStorage()) {
      webAuthToken = null;
      webRefreshToken = null;
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("refreshToken");
      return;
    }

    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("refreshToken");
  }
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const token = await authStorage.getToken();
        const storedRefreshToken = await authStorage.getRefreshToken();
        if (token) {
          setIsAuthenticated(true);
          setAuthToken(token);
          setRefreshToken(storedRefreshToken || null);
        }
      } finally {
        setAuthReady(true);
      }
    };

    hydrateAuth();
  }, []);

  const signIn = async (token = "local-auth-token", refreshToken = "") => {
    await authStorage.setTokens(token, refreshToken);
    setIsAuthenticated(true);
    setAuthToken(token);
    setRefreshToken(refreshToken || null);
    console.log("[AuthContext] signIn stored auth state");
  };

  const signOut = async () => {
    await authStorage.clearTokens();
    setIsAuthenticated(false);
    setAuthToken(null);
    setRefreshToken(null);
    console.log("[AuthContext] signOut cleared auth state");
  };

  const setToken = async (token, refreshToken = "") => {
    await authStorage.setTokens(token, refreshToken);
    setIsAuthenticated(true);
    setAuthToken(token);
    setRefreshToken(refreshToken || null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authReady,
        authToken,
        refreshToken,
        signIn,
        setToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
