import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../client";
import type { Task } from "../types";

// Query keys - centralized for easy invalidation
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
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
