/**
 * Tauri calendar sync utilities
 * Manages background sync for Google Calendar integration
 */

import { isTauri } from "@/lib/platform";
import { invoke } from "@tauri-apps/api/core";

export interface SyncStatus {
  is_syncing: boolean;
  last_sync: string | null;
  error: string | null;
}

/**
 * Start the background calendar sync service
 * This will sync every 15 minutes automatically
 */
export async function startCalendarSyncService(
  apiUrl: string,
  authToken: string
): Promise<void> {
  if (!isTauri()) {
    console.warn("Calendar sync service only available in Tauri");
    return;
  }

  try {
    await invoke("start_sync_service", {
      apiUrl,
      authToken,
    });
    console.log("Calendar sync service started");
  } catch (error) {
    console.error("Failed to start calendar sync service:", error);
    throw error;
  }
}

/**
 * Manually trigger a calendar sync
 */
export async function triggerCalendarSync(
  apiUrl: string,
  authToken: string
): Promise<void> {
  if (!isTauri()) {
    // Fallback to direct API call for web
    const response = await fetch(`${apiUrl}/api/calendar-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to sync calendar");
    }
    return;
  }

  try {
    await invoke("trigger_calendar_sync", {
      apiUrl,
      authToken,
    });
  } catch (error) {
    console.error("Failed to trigger calendar sync:", error);
    throw error;
  }
}

/**
 * Get the current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  if (!isTauri()) {
    return {
      is_syncing: false,
      last_sync: null,
      error: null,
    };
  }

  try {
    return await invoke("get_sync_status");
  } catch (error) {
    console.error("Failed to get sync status:", error);
    throw error;
  }
}
