import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthCredentials, UserProfile } from "../models/types";
import * as authService from "../services/auth";

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (credentials: AuthCredentials) => Promise<UserProfile>;
  signup: (data: AuthCredentials & { name?: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  setUser: (profile: UserProfile | null) => void;
};

const STORAGE_KEY = "auth:user";

const AuthCtx = createContext<AuthContextType | null>(null);

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
          const parsed: UserProfile = JSON.parse(stored);
          if (mounted) setUser(parsed);
          return;
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

  return (
    <AuthCtx.Provider value={{ user, loading, initialized, login, signup, logout, setUser: setUserHandler }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used under AuthProvider");
  return ctx;
}
