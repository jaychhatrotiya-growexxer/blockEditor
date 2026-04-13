"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  withAuthorizedRequest,
} from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const result = await refreshRequest();

        if (!cancelled) {
          setAccessToken(result.accessToken);
          setUser(result.user);
        }
      } catch (error) {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function register(values) {
    const result = await registerRequest(values);
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }

  async function login(values) {
    const result = await loginRequest(values);
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  async function authorizedRequest(path, options) {
    const result = await withAuthorizedRequest({
      path,
      options,
      accessToken,
      onAuthRefresh: async () => {
        const refreshed = await refreshRequest();
        setAccessToken(refreshed.accessToken);
        setUser(refreshed.user);
        return refreshed.accessToken;
      },
      onAuthFailure: () => {
        setAccessToken(null);
        setUser(null);
      },
    });

    return result;
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isBootstrapping,
        isAuthenticated: Boolean(accessToken && user),
        register,
        login,
        logout,
        authorizedRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
