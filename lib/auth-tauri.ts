/**
 * Tauri-specific authentication utilities
 * Handles OAuth flow and JWT session management for desktop app
 */

import { ApiClient } from "@/lib/api/client";
import { getApiUrl, isTauri } from "@/lib/platform";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

// Track the last redirect URI used so we can reuse it when exchanging the code
let lastRedirectUri: string | null = null;
let lastCodeVerifier: string | null = null;
let lastState: string | null = null;

type StoredAuthToken = {
  token: string;
  expires_at?: number | null;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

async function createCodeVerifier(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

async function fetchOAuthState(): Promise<string> {
  const response = await fetch(getApiUrl("/api/auth/tauri/state"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create OAuth state");
  }

  const data = await response.json();
  return data.state as string;
}

/**
 * Ask the Rust side to start a local loopback listener and return the redirect URI.
 * Google accepts loopback redirects for desktop apps (not custom schemes).
 */
async function getLoopbackRedirectUri(): Promise<string> {
  if (!isTauri()) {
    throw new Error("Loopback OAuth redirect only available in Tauri");
  }

  const redirectUri = await invoke<string>("start_oauth_listener");
  lastRedirectUri = redirectUri;
  return redirectUri;
}

/**
 * Start OAuth flow - opens browser for Google login
 */
export async function startTauriOAuthFlow(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DESKTOP;
  
  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID_DESKTOP configuration - see NEXT_STEPS_TAURI.md");
  }

  // Start loopback listener in Rust and get the redirect URI (http://127.0.0.1:<port>/callback)
  const redirectUri = await getLoopbackRedirectUri();
  const state = await fetchOAuthState();
  const codeVerifier = await createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);

  lastCodeVerifier = codeVerifier;
  lastState = state;

  console.info("[tauri-auth] oauth start", {
    redirectUri,
    statePrefix: state.slice(0, 8),
    codeChallengePrefix: codeChallenge.slice(0, 8),
    codeVerifierLength: codeVerifier.length,
  });

  // Build OAuth URL
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
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

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
  code: string,
  redirectUriOverride?: string,
  stateOverride?: string
): Promise<TauriSession> {
  const redirectUri = redirectUriOverride || lastRedirectUri;
  const codeVerifier = lastCodeVerifier;
  const state = stateOverride || lastState;

  if (!redirectUri) {
    throw new Error("Missing redirect URI for token exchange");
  }

  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier for token exchange");
  }

  if (!state) {
    throw new Error("Missing OAuth state for token exchange");
  }

  console.info("[tauri-auth] exchange code", {
    codePrefix: code.slice(0, 8),
    redirectUri,
    statePrefix: state.slice(0, 8),
    codeVerifierLength: codeVerifier.length,
  });

  const response = await fetch(getApiUrl("/api/auth/tauri/token"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      state,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to exchange code for token");
  }

  const data = await response.json();

  // Store token in ApiClient
  ApiClient.setAuthToken(data.token);
  lastCodeVerifier = null;
  lastState = null;

  return {
    user: data.user,
    token: data.token,
    expiresAt: data.expires_at,
  };
}

/**
 * Refresh a valid Tauri session JWT
 */
export async function refreshTauriSession(): Promise<TauriSession | null> {
  if (!isTauri()) return null;
  const session = await getTauriSession();
  if (!session) return null;

  const response = await fetch(getApiUrl("/api/auth/tauri/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const updatedSession: TauriSession = {
    user: session.user,
    token: data.token,
    expiresAt: data.expires_at,
  };
  await saveTauriSession(updatedSession);
  return updatedSession;
}

/**
 * Get current Tauri session from secure storage
 */
export async function getTauriSession(): Promise<TauriSession | null> {
  if (typeof window === "undefined" || !isTauri()) return null;

  let stored: StoredAuthToken | null;
  try {
    stored = await invoke<StoredAuthToken | null>("get_auth_token");
  } catch (error) {
    console.error("[tauri-auth] Keychain access error:", error);
    return null;
  }

  if (!stored?.token) return null;

  // Try to get expires_at from storage, or extract from JWT payload as fallback
  let expiresAtNum = stored.expires_at ? Number(stored.expires_at) : null;

  if (!expiresAtNum || !Number.isFinite(expiresAtNum)) {
    const payload = decodeJwtPayload(stored.token);
    if (payload?.exp) {
      expiresAtNum = payload.exp as number;
    } else {
      return null;
    }
  }

  if (Date.now() / 1000 > expiresAtNum) {
    await clearTauriSession();
    return null;
  }

  const user = decodeUserFromJwt(stored.token);
  if (!user) return null;

  ApiClient.setAuthToken(stored.token);

  return {
    user,
    token: stored.token,
    expiresAt: expiresAtNum,
  };
}

/**
 * Save Tauri session to secure storage
 */
export async function saveTauriSession(session: TauriSession): Promise<void> {
  if (typeof window === "undefined" || !isTauri()) return;

  // Tauri v2 converts snake_case params to camelCase
  await invoke("set_auth_token", {
    token: session.token,
    expiresAt: session.expiresAt,
  });
  ApiClient.setAuthToken(session.token);
}

/**
 * Clear Tauri session (logout)
 */
export async function clearTauriSession(): Promise<void> {
  if (typeof window === "undefined" || !isTauri()) return;

  await invoke("clear_auth_token");
  ApiClient.clearAuthToken();
}

/**
 * Listen for OAuth callback (deep link)
 */
export function listenForOAuthCallback(
  onCode: (code: string, state?: string) => void,
  onError: (error: string) => void
): () => void {
  if (!isTauri()) {
    return () => {};
  }

  let unlistenCode: (() => void) | null = null;
  let unlistenError: (() => void) | null = null;
  let active = true;

  if ((listenForOAuthCallback as any).__activeListener) {
    return () => {};
  }
  (listenForOAuthCallback as any).__activeListener = true;

  (async () => {
    try {
      unlistenCode = await listen<{ code: string; state?: string }>(
        "oauth-code-received",
        (event) => {
          onCode(event.payload.code, event.payload.state);
        }
      );
      if (!active && unlistenCode) {
        unlistenCode();
        unlistenCode = null;
        return;
      }

      unlistenError = await listen<string>("oauth-error", (event) => {
        onError(event.payload);
      });
      if (!active && unlistenError) {
        unlistenError();
        unlistenError = null;
      }
    } catch (error) {
      console.error("Failed to register OAuth listeners:", error);
    }
  })();

  return () => {
    active = false;
    (listenForOAuthCallback as any).__activeListener = false;
    if (unlistenCode) unlistenCode();
    if (unlistenError) unlistenError();
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function decodeUserFromJwt(token: string): TauriUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const id = payload.sub as string | undefined;
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!id || !email) return null;
  return {
    id,
    email,
    name: typeof payload.name === "string" ? payload.name : null,
    image: typeof payload.picture === "string" ? payload.picture : null,
  };
}
