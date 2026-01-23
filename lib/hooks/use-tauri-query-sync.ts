/**
 * Hook to synchronize React Query cache across Tauri windows
 * Listens for invalidate-queries events and invalidates the corresponding queries
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listen, TauriEvents, type InvalidateQueriesPayload } from "@/lib/tauri/events";
import { isTauri } from "@/lib/platform";

export function useTauriQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isTauri()) return;

    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen(TauriEvents.INVALIDATE_QUERIES, (payload: InvalidateQueriesPayload) => {
        // Invalidate each query key received in the event
        for (const key of payload.queryKeys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [queryClient]);
}
