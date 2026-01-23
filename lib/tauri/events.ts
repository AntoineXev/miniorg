/**
 * Centralized Tauri events module
 * Provides typed event names and helper functions for cross-window communication
 */

import { emit as tauriEmit, listen as tauriListen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauri } from "@/lib/platform";

// Event names as typed constants
export const TauriEvents = {
  OPEN_QUICK_ADD: "open-quick-add",
  OAUTH_CODE_RECEIVED: "oauth-code-received",
  OAUTH_ERROR: "oauth-error",
  INVALIDATE_QUERIES: "invalidate-queries",
} as const;

// Event payload types
export interface InvalidateQueriesPayload {
  queryKeys: string[];
}

export interface OAuthCodeReceivedPayload {
  code: string;
  state?: string;
}

// Type mapping for events
export interface TauriEventPayloads {
  [TauriEvents.OPEN_QUICK_ADD]: void;
  [TauriEvents.OAUTH_CODE_RECEIVED]: OAuthCodeReceivedPayload;
  [TauriEvents.OAUTH_ERROR]: string;
  [TauriEvents.INVALIDATE_QUERIES]: InvalidateQueriesPayload;
}

/**
 * Emit a Tauri event to all windows
 * No-op if not running in Tauri
 */
export async function emit<K extends keyof TauriEventPayloads>(
  event: K,
  payload?: TauriEventPayloads[K]
): Promise<void> {
  if (!isTauri()) return;

  try {
    await tauriEmit(event, payload);
  } catch (error) {
    console.error(`[tauri-events] Failed to emit ${event}:`, error);
  }
}

/**
 * Listen for a Tauri event
 * Returns a no-op cleanup function if not running in Tauri
 */
export async function listen<K extends keyof TauriEventPayloads>(
  event: K,
  handler: (payload: TauriEventPayloads[K]) => void
): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => {};
  }

  try {
    return await tauriListen<TauriEventPayloads[K]>(event, (e) => {
      handler(e.payload);
    });
  } catch (error) {
    console.error(`[tauri-events] Failed to listen to ${event}:`, error);
    return () => {};
  }
}

/**
 * Emit invalidate-queries event to sync React Query cache across windows
 */
export async function emitInvalidateQueries(queryKeys: string[]): Promise<void> {
  await emit(TauriEvents.INVALIDATE_QUERIES, { queryKeys });
}
