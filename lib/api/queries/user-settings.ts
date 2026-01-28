import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../client";
import type { UserSettings } from "../types";

export const userSettingsKeys = {
  all: ["user-settings"] as const,
};

export function useUserSettingsQuery() {
  return useQuery({
    queryKey: userSettingsKeys.all,
    queryFn: () => ApiClient.get<UserSettings>("/api/user/settings"),
  });
}
