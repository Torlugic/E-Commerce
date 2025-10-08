import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { UserProfile } from "../models/types";

type AuthContextType = {
  user: UserProfile | null;
  loginMock: (user: UserProfile) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const loginMock = (user: UserProfile) => {
    setUser(user);
  };
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loginMock, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used under AuthProvider");
  return ctx;
}
