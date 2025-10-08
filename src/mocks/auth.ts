import type { AuthCredentials, UserProfile } from "../models/types";

const fakeUser: UserProfile = {
  id: "user1",
  email: "user@example.com",
  name: "Example User",
  createdAt: new Date().toISOString(),
};

export async function login(credentials: AuthCredentials): Promise<UserProfile> {
  // simulate delay
  await new Promise((r) => setTimeout(r, 500));
  if (credentials.email === fakeUser.email && credentials.password === "password") {
    return fakeUser;
  }
  throw new Error("Invalid credentials");
}

export async function signup(creds: AuthCredentials & { name: string }): Promise<UserProfile> {
  await new Promise((r) => setTimeout(r, 500));
  // just return fake user ignoring input
  return { id: "user2", email: creds.email, name: creds.name, createdAt: new Date().toISOString() };
}
