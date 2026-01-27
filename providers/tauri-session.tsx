"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useSession as useNextAuthSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isTauri } from "@/lib/platform";
import {
  getTauriSession,
  saveTauriSession,
  clearTauriSession,
  startTauriOAuthFlow,
  exchangeCodeForToken,
  listenForOAuthCallback,
  type TauriSession,
} from "@/lib/auth-tauri";
import { clearOnboardingState } from "@/lib/hooks/use-onboarding";
import { clearQueryCache } from "@/providers/query-provider";
import { toast } from "sonner";

interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface UnifiedSession {
  user: UnifiedUser;
}

interface TauriSessionContextType {
  session: UnifiedSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const TauriSessionContext = createContext<TauriSessionContextType | undefined>(
  undefined
);

/**
 * Unified session provider that works for both web (NextAuth) and Tauri (JWT)
 */
export function TauriSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const LOG_PREFIX = "[tauri-auth-debug]";
  const shouldLog = process.env.NEXT_PUBLIC_TAURI_AUTH_DEBUG === "1";
  const isDesktop = isTauri();
  const router = useRouter();
  const oauthHandled = useRef(false);
  const lastOAuthCode = useRef<string | null>(null);

  // Web session (NextAuth)
  const webSession = useNextAuthSession();

  // Tauri session (JWT)
  const [tauriSession, setTauriSession] = useState<TauriSession | null>(null);
  const [tauriStatus, setTauriStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  // Log environment info once
  useEffect(() => {
    if (!shouldLog) return;
    const w = typeof window !== "undefined" ? (window as any) : undefined;
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent : "navigator-missing";
    console.log(LOG_PREFIX, "env", {
      isDesktop,
      ua,
      hasTauriGlobals: {
        __TAURI__: !!w?.__TAURI__,
        __TAURI_INTERNALS__: !!w?.__TAURI_INTERNALS__,
        __TAURI_METADATA__: !!w?.__TAURI_METADATA__,
        tauri: !!w?.tauri,
      },
    });
  }, [isDesktop, shouldLog]);

  // Load Tauri session on mount
  useEffect(() => {
    if (!isDesktop) {
      setTauriStatus("unauthenticated");
      return;
    }

    let active = true;

    (async () => {
      const session = await getTauriSession();
      if (shouldLog) {
        console.log(LOG_PREFIX, "load session from storage", session);
      }
      if (!active) return;
      if (session) {
        setTauriStatus("authenticated");
        setTauriSession(session);
      } else {
        setTauriStatus("unauthenticated");
      }
    })();

    return () => {
      active = false;
    };
  }, [isDesktop, shouldLog]);

  // Listen for OAuth callbacks (Tauri only, main window only)
  // The quick-add window should NOT process OAuth callbacks since it doesn't have
  // the redirect URI and code verifier that were set when the flow started.
  useEffect(() => {
    if (!isDesktop) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      // Only listen in the main window - quick-add window doesn't have the OAuth context
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const windowLabel = getCurrentWindow().label;
      if (windowLabel !== "main") {
        if (shouldLog) {
          console.log(LOG_PREFIX, "skipping oauth listener (not main window)", { windowLabel });
        }
        return;
      }

      cleanup = listenForOAuthCallback(
        async (code, state) => {
          if (lastOAuthCode.current === code) {
            if (shouldLog) {
              console.log(LOG_PREFIX, "duplicate oauth code ignored", {
                codePrefix: code.slice(0, 8),
              });
            }
            return;
          }
          if (oauthHandled.current) return;
          oauthHandled.current = true;
          lastOAuthCode.current = code;
          try {
            if (shouldLog) {
              console.log(LOG_PREFIX, "oauth callback received", { code });
            }
            setTauriStatus("loading");
            const session = await exchangeCodeForToken(code, undefined, state);
            if (shouldLog) {
              console.log(LOG_PREFIX, "token exchange success", session);
            }
            await saveTauriSession(session);
            setTauriSession(session);
            setTauriStatus("authenticated");
            toast.success("Successfully logged in!");
            // Redirect immediately after successful auth
            router.push("/onboarding");
          } catch (error: any) {
            console.error("OAuth exchange error:", error);
            toast.error("Failed to log in: " + error.message);
            setTauriStatus("unauthenticated");
          }
        },
        (error) => {
          console.error("OAuth error:", error);
          toast.error("Authentication error: " + error);
          setTauriStatus("unauthenticated");
        }
      );
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [isDesktop, shouldLog]);

  // Reset the "handled" flag when we explicitly log out or lose session
  useEffect(() => {
    if (!isDesktop) return;
    if (tauriStatus === "unauthenticated") {
      if (shouldLog) {
        console.log(LOG_PREFIX, "status unauthenticated, reset oauthHandled");
      }
      oauthHandled.current = false;
    }
  }, [isDesktop, tauriStatus]);

  // Redirect to backlog after successful Tauri auth (only when inside auth flow)
  useEffect(() => {
    if (!isDesktop) return;
    if (tauriStatus !== "authenticated") return;
    // Avoid running if already on dashboard
    const isOnDashboard =
      typeof window !== "undefined" &&
      (window.location.pathname !== "/login")

    if (!isOnDashboard) {
      if (shouldLog) {
        console.log(LOG_PREFIX, "redirecting to calendar after auth", {
          pathname:
            typeof window !== "undefined" ? window.location.pathname : "no-window",
        });
      }
      router.push("/calendar");
    }
  }, [isDesktop, tauriStatus, router, shouldLog]);

  // Login handler
  const login = async () => {
    if (shouldLog) {
      console.log(LOG_PREFIX, "login click", { isDesktop });
    }
    if (isDesktop) {
      try {
        await startTauriOAuthFlow();
        oauthHandled.current = false;
        toast.info("Opening browser for login...");
      } catch (error: any) {
        console.error("Failed to start OAuth flow:", error);
        toast.error("Failed to start login: " + error.message);
      }
    } else {
      // For web, redirect to NextAuth login
      router.push("/login");
    }
  };

  // Logout handler
  const logout = async () => {
    // Clear onboarding state on logout
    clearOnboardingState();

    // Clear React Query cache to remove previous user's data
    clearQueryCache();

    if (isDesktop) {
      await clearTauriSession();
      setTauriSession(null);
      setTauriStatus("unauthenticated");
      toast.success("Logged out successfully");
    } else {
      // For web, use NextAuth signOut
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/login" });
    }
  };

  // Determine final session and status
  const session: UnifiedSession | null = isDesktop
    ? tauriSession
      ? { user: tauriSession.user }
      : null
    : webSession.data
    ? {
        user: {
          id: webSession.data.user.id,
          email: webSession.data.user.email!,
          name: webSession.data.user.name || null,
          image: webSession.data.user.image || null,
        },
      }
    : null;

  const status = isDesktop ? tauriStatus : webSession.status;

  useEffect(() => {
    if (!shouldLog) return;
    console.log(LOG_PREFIX, "status changed", { status, session });
  }, [status, session, shouldLog]);

  return (
    <TauriSessionContext.Provider value={{ session, status, login, logout }}>
      {children}
    </TauriSessionContext.Provider>
  );
}

/**
 * Hook to access unified session (works for both web and Tauri)
 */
export function useTauriSession() {
  const context = useContext(TauriSessionContext);
  if (context === undefined) {
    throw new Error("useTauriSession must be used within TauriSessionProvider");
  }
  return context;
}
