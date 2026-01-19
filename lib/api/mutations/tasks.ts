import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { taskKeys } from "../queries/tasks";
import { calendarEventKeys } from "../queries/calendar-events";
import type { Task } from "../types";

// Hook to create a task
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task>) => ApiClient.post<Task>("/api/tasks", data),
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create task");
      console.error(error);
    },
  });
}

// Hook to update a task
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task> & { id: string }) =>
      ApiClient.patch<Task>("/api/tasks", data),
    onSuccess: () => {
      // Invalidate both tasks and events (they're linked)
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update task");
      console.error(error);
    },
  });
}

// Hook to delete a task
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => ApiClient.delete(`/api/tasks?id=${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete task");
      console.error(error);
    },
  });
}
