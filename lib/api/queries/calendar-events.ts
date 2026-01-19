import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../client";
import type { CalendarEvent } from "../types";

export const calendarEventKeys = {
  all: ["calendar-events"] as const,
  lists: () => [...calendarEventKeys.all, "list"] as const,
  list: (filters?: { startDate?: string; endDate?: string; taskId?: string }) =>
    [...calendarEventKeys.lists(), filters] as const,
  details: () => [...calendarEventKeys.all, "detail"] as const,
  detail: (id: string) => [...calendarEventKeys.details(), id] as const,
};

export function useCalendarEventsQuery(params?: {
  startDate?: string;
  endDate?: string;
  taskId?: string;
}) {
  const queryString = params
    ? new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
      ).toString()
    : "";

  return useQuery({
    queryKey: calendarEventKeys.list(params),
    queryFn: () =>
      ApiClient.get<CalendarEvent[]>(
        `/api/calendar-events${queryString ? `?${queryString}` : ""}`
      ),
  });
}
