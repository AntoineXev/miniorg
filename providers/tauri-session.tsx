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
  const isDesktop = isTauri();
  const router = useRouter();
  const oauthHandled = useRef(false);

  // Web session (NextAuth)
  const webSession = useNextAuthSession();

  // Tauri session (JWT)
  const [tauriSession, setTauriSession] = useState<TauriSession | null>(null);
  const [tauriStatus, setTauriStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  // Mark Tauri client via cookie so middleware can bypass NextAuth redirect
  useEffect(() => {
    if (!isDesktop) return;
    try {
      document.cookie = "tauri-client=1; path=/; SameSite=Lax";
    } catch (e) {
      console.warn(LOG_PREFIX, "failed to set tauri-client cookie", e);
    }
  }, [isDesktop]);

  // Log environment info once
  useEffect(() => {
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
  }, [isDesktop]);

  // Load Tauri session on mount
  useEffect(() => {
    if (!isDesktop) {
      setTauriStatus("unauthenticated");
      return;
    }

    const session = getTauriSession();
    console.log(LOG_PREFIX, "load session from storage", session);
    if (session) {
      setTauriSession(session);
      setTauriStatus("authenticated");
    } else {
      setTauriStatus("unauthenticated");
    }
  }, [isDesktop]);

  // Listen for OAuth callbacks (Tauri only)
  useEffect(() => {
    if (!isDesktop) return;

    const cleanup = listenForOAuthCallback(
      async (code) => {
        if (oauthHandled.current) return;
        oauthHandled.current = true;
        try {
          console.log(LOG_PREFIX, "oauth callback received", { code });
          setTauriStatus("loading");
          const session = await exchangeCodeForToken(code);
          console.log(LOG_PREFIX, "token exchange success", session);
          saveTauriSession(session);
          setTauriSession(session);
          setTauriStatus("authenticated");
          toast.success("Successfully logged in!");
          // Redirect immediately after successful auth
          router.push("/backlog");
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

    return cleanup;
  }, [isDesktop]);

  // Reset the "handled" flag when we explicitly log out or lose session
  useEffect(() => {
    if (!isDesktop) return;
    if (tauriStatus === "unauthenticated") {
      console.log(LOG_PREFIX, "status unauthenticated, reset oauthHandled");
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
      (window.location.pathname === "/backlog" ||
        window.location.pathname.startsWith("/backlog") ||
        window.location.pathname.startsWith("/dashboard"));

    if (!isOnDashboard) {
      console.log(LOG_PREFIX, "redirecting to backlog after auth", {
        pathname: typeof window !== "undefined" ? window.location.pathname : "no-window",
      });
      router.push("/backlog");
    }
  }, [isDesktop, tauriStatus, router]);

  // Login handler
  const login = async () => {
    console.log(LOG_PREFIX, "login click", { isDesktop });
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
      window.location.href = "/login";
    }
  };

  // Logout handler
  const logout = async () => {
    if (isDesktop) {
      clearTauriSession();
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
    console.log(LOG_PREFIX, "status changed", { status, session });
  }, [status, session]);

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
