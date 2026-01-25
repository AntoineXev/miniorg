import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ApiClient } from "../client";
import type { Task, DailyRitual } from "../types";

// Query keys - centralized for easy invalidation
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  highlight: (date: string) => [...taskKeys.all, "highlight", date] as const,
};

export const dailyRitualKeys = {
  all: ["daily-rituals"] as const,
  byDate: (date: string) => [...dailyRitualKeys.all, date] as const,
};

// Hook to fetch all tasks
export function useTasksQuery() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => ApiClient.get<Task[]>("/api/tasks"),
  });
}

// Hook to fetch a specific task (optional, for future use)
export function useTaskQuery(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => ApiClient.get<Task>(`/api/tasks?id=${taskId}`),
    enabled: !!taskId,
  });
}

// Hook to fetch highlight task for a specific date
export function useHighlightQuery(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: taskKeys.highlight(dateStr),
    queryFn: () => ApiClient.get<Task | null>(`/api/tasks/highlight?date=${dateStr}`),
  });
}

// Hook to fetch daily ritual for a specific date
export function useDailyRitualQuery(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: dailyRitualKeys.byDate(dateStr),
    queryFn: () => ApiClient.get<DailyRitual | null>(`/api/daily-ritual?date=${dateStr}`),
  });
}
