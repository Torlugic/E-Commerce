import type { AuthCredentials, UserProfile } from "../models/types";
import { login as mockLogin, signup as mockSignup } from "../mocks/auth";
import { apiFetch, usingMocks } from "./http";

const LOGIN_ENDPOINT = "/auth/login";
const SIGNUP_ENDPOINT = "/auth/signup";
const PROFILE_ENDPOINT = "/auth/me";
const LOGOUT_ENDPOINT = "/auth/logout";

export async function login(credentials: AuthCredentials): Promise<UserProfile> {
  if (usingMocks()) {
    return mockLogin(credentials);
  }

  return apiFetch<UserProfile>(LOGIN_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function signup(data: AuthCredentials & { name?: string }): Promise<UserProfile> {
  if (usingMocks()) {
    return mockSignup({ ...data, name: data.name ?? data.email.split("@")[0] });
  }

  return apiFetch<UserProfile>(SIGNUP_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getProfile(): Promise<UserProfile | null> {
  if (usingMocks()) {
    return null;
  }

  try {
    return await apiFetch<UserProfile>(PROFILE_ENDPOINT, { method: "GET" });
  } catch (err) {
    console.warn("Failed to fetch profile", err);
    return null;
  }
}

export async function logout(): Promise<void> {
  if (usingMocks()) {
    return;
  }

  try {
    await apiFetch<void>(LOGOUT_ENDPOINT, { method: "POST" });
  } catch (err) {
    console.warn("Failed to call logout endpoint", err);
  }
}
