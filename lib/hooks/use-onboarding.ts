"use client";

import { useState, useEffect, useCallback } from "react";

const ONBOARDING_COMPLETED_KEY = "miniorg-onboarding-completed";

/**
 * Get onboarding completion state synchronously.
 * Safe to call on client-side only.
 */
function getOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Hook to manage onboarding completion state in localStorage.
 * Works with both web and Tauri environments.
 */
export function useOnboarding() {
  // Initialize with actual value on client, false on server
  const [isCompleted, setIsCompleted] = useState(() => getOnboardingCompleted());
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted after first render (for hydration)
  useEffect(() => {
    setIsCompleted(getOnboardingCompleted());
    setIsMounted(true);
  }, []);

  // Mark onboarding as completed
  const completeOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      setIsCompleted(true);
    } catch (error) {
      console.error("Failed to save onboarding state:", error);
    }
  }, []);

  // Reset onboarding (for logout or manual restart)
  const resetOnboarding = useCallback(() => {
    try {
      window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setIsCompleted(false);
    } catch (error) {
      console.error("Failed to reset onboarding state:", error);
    }
  }, []);

  return {
    isCompleted,
    isLoading: !isMounted,
    completeOnboarding,
    resetOnboarding,
  };
}

/**
 * Clear onboarding state from localStorage.
 * Can be called outside of React components (e.g., in logout handler).
 */
export function clearOnboardingState() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {
      // Ignore errors
    }
  }
}
