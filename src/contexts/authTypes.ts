import type { AuthCredentials, UserProfile } from "../models/types";

export type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (credentials: AuthCredentials) => Promise<UserProfile>;
  signup: (data: AuthCredentials & { name?: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  setUser: (profile: UserProfile | null) => void;
};
