import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { userSettingsKeys } from "../queries/user-settings";
import { emitInvalidateQueries } from "@/lib/tauri/events";
import type { UserSettings, RitualMode } from "../types";

type UpdateSettingsInput = {
  ritualMode?: RitualMode;
  autoMoveEventsOnComplete?: boolean;
};

export function useUpdateUserSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsInput) =>
      ApiClient.patch<UserSettings>("/api/user/settings", data),
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userSettingsKeys.all });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(userSettingsKeys.all);

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(userSettingsKeys.all, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: userSettingsKeys.all });
      emitInvalidateQueries(["user-settings"]);
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousSettings) {
        queryClient.setQueryData(userSettingsKeys.all, context.previousSettings);
      }
      toast.error("Failed to update settings");
      console.error(error);
    },
  });
}
