/**
 * Tauri native notifications wrapper
 * Provides a unified interface for notifications across web and desktop
 */

import { isTauri } from "@/lib/platform";
import { invoke } from "@tauri-apps/api/core";

/**
 * Send a notification (native on Tauri, browser on web)
 */
export async function sendNotification(
  title: string,
  body: string
): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("send_notification", {
        title,
        body,
      });
    } catch (error) {
      console.error("Failed to send native notification:", error);
    }
  } else {
    // Fallback to browser notification API
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body });
        }
      }
    }
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invoke("request_notification_permission");
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  } else {
    // Browser notification permission
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return isTauri() || "Notification" in window;
}
