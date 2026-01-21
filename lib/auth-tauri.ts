/**
 * Tauri-specific authentication utilities
 * Handles OAuth flow and JWT session management for desktop app
 */

import { ApiClient } from "@/lib/api/client";
import { open } from "@tauri-apps/plugin-shell";

export interface TauriUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface TauriSession {
  user: TauriUser;
  token: string;
  expiresAt: number;
}

/**
 * Start OAuth flow - opens browser for Google login
 */
export async function startTauriOAuthFlow(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP;
  
  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID_DESKTOP configuration - see NEXT_STEPS_TAURI.md");
  }

  // Build OAuth URL
  const redirectUri = "tauri://localhost";
  const scope = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  // Open in default browser using Tauri's shell
  try {
    await open(authUrl.toString());
  } catch (error) {
    console.error("Failed to open OAuth URL:", error);
    // Fallback to window.open
    window.open(authUrl.toString(), "_blank");
  }
}

/**
 * Exchange OAuth code for JWT token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<TauriSession> {
  const response = await fetch("/api/auth/tauri/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      redirect_uri: "tauri://localhost",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to exchange code for token");
  }

  const data = await response.json();
  
  // Store token in ApiClient
  ApiClient.setAuthToken(data.token);

  return {
    user: data.user,
    token: data.token,
    expiresAt: data.expires_at,
  };
}

/**
 * Get current Tauri session from localStorage
 */
export function getTauriSession(): TauriSession | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("miniorg_jwt_token");
  const userJson = localStorage.getItem("miniorg_user");
  const expiresAt = localStorage.getItem("miniorg_expires_at");

  if (!token || !userJson || !expiresAt) return null;

  // Check if token is expired
  const expiresAtNum = parseInt(expiresAt, 10);
  if (Date.now() / 1000 > expiresAtNum) {
    clearTauriSession();
    return null;
  }

  try {
    const user = JSON.parse(userJson);
    return {
      user,
      token,
      expiresAt: expiresAtNum,
    };
  } catch {
    return null;
  }
}

/**
 * Save Tauri session to localStorage
 */
export function saveTauriSession(session: TauriSession): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("miniorg_jwt_token", session.token);
  localStorage.setItem("miniorg_user", JSON.stringify(session.user));
  localStorage.setItem("miniorg_expires_at", session.expiresAt.toString());
}

/**
 * Clear Tauri session (logout)
 */
export function clearTauriSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("miniorg_jwt_token");
  localStorage.removeItem("miniorg_user");
  localStorage.removeItem("miniorg_expires_at");
  ApiClient.clearAuthToken();
}

/**
 * Listen for OAuth callback (deep link)
 */
export function listenForOAuthCallback(
  onCode: (code: string) => void,
  onError: (error: string) => void
): () => void {
  // For now, we'll handle OAuth differently - the Rust backend will emit events
  // that we can catch, but we need to set up the listeners properly
  
  // Temporary: just return an empty cleanup function
  // The OAuth flow will be handled when we set up the desktop client
  console.log("OAuth callback listener would be set up here");
  
  return () => {
    console.log("OAuth callback listener cleanup");
  };
}
