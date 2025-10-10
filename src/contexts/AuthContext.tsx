import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { AuthCredentials, UserProfile } from "../models/types";
import type { AuthContextValue } from "./authTypes";
import * as authService from "../services/auth";

const STORAGE_KEY = "auth:user";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const persist = useCallback((profile: UserProfile | null) => {
    if (typeof window === "undefined") return;
    try {
      if (profile) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn("Failed to persist auth session", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored) {
          try {
            const parsed: UserProfile = JSON.parse(stored);
            if (mounted) {
              setUser(parsed);
              setInitialized(true);
            }
            return;
          } catch (error) {
            console.warn("Stored auth state is corrupt, clearing it", error);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(STORAGE_KEY);
            }
          }
        }

        const profile = await authService.getProfile();
        if (profile && mounted) {
          setUser(profile);
          persist(profile);
        }
      } catch (err) {
        console.warn("Failed to restore auth session", err);
      } finally {
        if (mounted) setInitialized(true);
      }
    };

    restore();

    return () => {
      mounted = false;
    };
  }, [persist]);

  const login = useCallback(async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      const profile = await authService.login(credentials);
      setUser(profile);
      persist(profile);
      return profile;
    } finally {
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized, persist]);

  const signup = useCallback(async (data: AuthCredentials & { name?: string }) => {
    setLoading(true);
    try {
      const profile = await authService.signup(data);
      setUser(profile);
      persist(profile);
      return profile;
    } finally {
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized, persist]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      persist(null);
      setLoading(false);
    }
  }, [persist]);

  const setUserHandler = useCallback((profile: UserProfile | null) => {
    setUser(profile);
    persist(profile);
  }, [persist]);

  const value: AuthContextValue = {
    user,
    loading,
    initialized,
    login,
    signup,
    logout,
    setUser: setUserHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
