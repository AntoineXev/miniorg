"use client";

import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, TauriEvents } from "@/lib/tauri/events";
import { useQuickAddTask } from "@/providers/quick-add-task";
import { QuickAddTask } from "@/components/tasks/quick-add-task";

/**
 * Hook to listen for Tauri events that trigger opening the quick add modal
 */
function useQuickAddListener(onOpen: () => void) {
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen(TauriEvents.OPEN_QUICK_ADD, () => {
        onOpen();
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [onOpen]);
}

/**
 * Window component for the quick add task modal in Tauri
 * Listens for Tauri events and manages window visibility
 */
export function QuickAddWindow() {
  const { isOpen, openQuickAdd } = useQuickAddTask();
  const prevIsOpen = useRef(isOpen);

  // Listen for Tauri events to open the modal
  useQuickAddListener(() => {
    openQuickAdd();
  });

  // Handle window visibility when modal closes
  useEffect(() => {
    const wasOpen = prevIsOpen.current;
    const isNowClosed = wasOpen && !isOpen;

    if (isNowClosed) {
      invoke("hide_quick_add_window").catch((error) => {
        console.error("Failed to hide quick add window:", error);
      });
    }

    prevIsOpen.current = isOpen;
  }, [isOpen]);

  return (
    <div>
      <QuickAddTask hideButton={true} hideHints={true} disableDatePickerPortal />
    </div>
  );
}