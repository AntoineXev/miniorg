"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession as useNextAuthSession } from "next-auth/react";
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
  const isDesktop = isTauri();

  // Web session (NextAuth)
  const webSession = useNextAuthSession();

  // Tauri session (JWT)
  const [tauriSession, setTauriSession] = useState<TauriSession | null>(null);
  const [tauriStatus, setTauriStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  // Load Tauri session on mount
  useEffect(() => {
    if (!isDesktop) {
      setTauriStatus("unauthenticated");
      return;
    }

    const session = getTauriSession();
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
        try {
          setTauriStatus("loading");
          const session = await exchangeCodeForToken(code);
          saveTauriSession(session);
          setTauriSession(session);
          setTauriStatus("authenticated");
          toast.success("Successfully logged in!");
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

  // Login handler
  const login = async () => {
    if (isDesktop) {
      try {
        await startTauriOAuthFlow();
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
