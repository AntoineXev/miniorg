"use client";

import { useEffect, useRef } from "react";
import { listen, emit, TauriEvents, type CreateTaskPayload } from "@/lib/tauri/events";
import { useCreateTaskMutation } from "@/lib/api/mutations/tasks";
import { usePlatform } from "@/lib/hooks/use-platform";

// Use window object for singleton state to survive HMR
const LISTENER_KEY = "__TAURI_TASK_HANDLER_ACTIVE__";
const UNLISTEN_KEY = "__TAURI_TASK_HANDLER_UNLISTEN__";
const IN_PROGRESS_KEY = "__TAURI_TASK_CREATION_IN_PROGRESS__";

function getGlobal<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any)[key];
}

function setGlobal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  (window as any)[key] = value;
}

/**
 * Hook that listens for CREATE_TASK events from other windows (e.g., quick-add)
 * and creates the task using the main window's session and React Query cache.
 *
 * This should only be used in the main window.
 */
export function useTauriTaskHandler() {
  const { isTauri } = usePlatform();
  const createTask = useCreateTaskMutation();

  // Use ref to avoid re-creating listener when createTask changes
  const createTaskRef = useRef(createTask);
  createTaskRef.current = createTask;

  useEffect(() => {
    if (!isTauri) return;

    // Singleton: only one listener globally (survives HMR)
    if (getGlobal<boolean>(LISTENER_KEY)) {
      console.log("[tauri-task-handler] Listener already active, skipping");
      return;
    }

    (async () => {
      // Only handle in main window
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const windowLabel = getCurrentWindow().label;

      if (windowLabel !== "main") {
        return;
      }

      // Double-check after async
      if (getGlobal<boolean>(LISTENER_KEY)) {
        return;
      }

      // Clean up any existing listener first
      const existingUnlisten = getGlobal<(() => void) | null>(UNLISTEN_KEY);
      if (existingUnlisten) {
        console.log("[tauri-task-handler] Cleaning up existing listener");
        existingUnlisten();
      }

      setGlobal(LISTENER_KEY, true);
      console.log("[tauri-task-handler] Setting up listener");

      const unlisten = await listen(TauriEvents.CREATE_TASK, async (payload: CreateTaskPayload) => {
        console.log("[tauri-task-handler] Received create-task event:", payload);

        // Prevent duplicate processing
        if (getGlobal<boolean>(IN_PROGRESS_KEY)) {
          console.log("[tauri-task-handler] Task creation already in progress, ignoring duplicate");
          return;
        }

        setGlobal(IN_PROGRESS_KEY, true);

        try {
          await createTaskRef.current.mutateAsync({
            title: payload.title,
            description: payload.description,
            deadlineType: payload.deadlineType,
            scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : undefined,
            duration: payload.duration,
            tagId: payload.tagId,
          });

          // Notify quick-add window that task was created successfully
          await emit(TauriEvents.TASK_CREATED, { success: true });
        } catch (error: any) {
          console.error("[tauri-task-handler] Failed to create task:", error);
          await emit(TauriEvents.TASK_CREATED, {
            success: false,
            error: error.message || "Failed to create task"
          });
        } finally {
          setGlobal(IN_PROGRESS_KEY, false);
        }
      });

      setGlobal(UNLISTEN_KEY, unlisten);
    })();

    return () => {
      // Don't clean up on unmount - let it persist
      // Cleanup happens on next setup if needed
    };
  }, [isTauri]);
}
