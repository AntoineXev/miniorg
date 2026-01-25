import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { taskKeys, dailyRitualKeys } from "../queries/tasks";
import { calendarEventKeys } from "../queries/calendar-events";
import { emitInvalidateQueries } from "@/lib/tauri/events";
import type { Task, TaskInput, DailyRitual } from "../types";

// Hook to create a task
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskInput) => ApiClient.post<Task>("/api/tasks", data),
    onMutate: async (newTask) => {
      const toastId = toast.loading("Creating task...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update with temporary ID
      if (previousTasks) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          title: newTask.title || "",
          description: newTask.description || "",
          status: newTask.status || "backlog",
          createdAt: new Date(),
          updatedAt: new Date(),
          ...newTask,
        } as Task;

        queryClient.setQueryData<Task[]>(taskKeys.all, [...previousTasks, optimisticTask]);
      }

      return { previousTasks, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Task created", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      // Emit event to sync cache across all Tauri windows
      emitInvalidateQueries(["tasks"]);
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
      toast.error("Failed to create task", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to update a task
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskInput & { id: string }) =>
      ApiClient.patch<Task>("/api/tasks", data),
    onMutate: async (updatedTask) => {
      const toastId = toast.loading("Updating task...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.map((task) => {
            if (task.id !== updatedTask.id) return task;

            const merged = { ...task, ...updatedTask };

            // Si on marque comme done, ajouter completedAt pour l'affichage calendrier
            if (updatedTask.status === "done" && !task.completedAt) {
              merged.completedAt = new Date();
            }
            // Si on dé-marque comme done, effacer completedAt
            // Note: status peut être "" (empty string) quand on décoche
            else if (updatedTask.status !== undefined && updatedTask.status !== "done" && task.completedAt) {
              merged.completedAt = null;
            }

            return merged;
          })
        );
      }

      return { previousTasks, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Task updated", { id: context?.toastId });
      // Invalidate both tasks and events (they're linked)
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      // Emit event to sync cache across all Tauri windows
      emitInvalidateQueries(["tasks", "calendar-events"]);
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
      toast.error("Failed to update task", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to delete a task
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => ApiClient.delete(`/api/tasks?id=${taskId}`),
    onMutate: async (taskId) => {
      const toastId = toast.loading("Deleting task...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically remove the task
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.filter((task) => task.id !== taskId)
        );
      }

      return { previousTasks, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Task deleted", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      // Emit event to sync cache across all Tauri windows
      emitInvalidateQueries(["tasks", "calendar-events"]);
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
      toast.error("Failed to delete task", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to upsert (create or update) highlight for a specific date
export function useUpsertHighlightMutation(date: Date) {
  const queryClient = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");

  return useMutation({
    mutationFn: (title: string) =>
      ApiClient.post<Task>("/api/tasks/highlight", { title, date: dateStr }),
    onMutate: async (title) => {
      const toastId = toast.loading("Saving highlight...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.highlight(dateStr) });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Snapshot previous values
      const previousHighlight = queryClient.getQueryData<Task | null>(
        taskKeys.highlight(dateStr)
      );
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Optimistically update highlight
      const optimisticHighlight: Task = previousHighlight
        ? { ...previousHighlight, title }
        : {
            id: `temp-${Date.now()}`,
            title,
            type: "highlight",
            status: "planned",
            scheduledDate: date,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

      queryClient.setQueryData<Task | null>(
        taskKeys.highlight(dateStr),
        optimisticHighlight
      );

      // Also update in the main tasks list
      if (previousTasks) {
        const existingIndex = previousTasks.findIndex(
          (t) => t.id === previousHighlight?.id
        );
        if (existingIndex >= 0) {
          const updated = [...previousTasks];
          updated[existingIndex] = optimisticHighlight;
          queryClient.setQueryData<Task[]>(taskKeys.all, updated);
        } else {
          queryClient.setQueryData<Task[]>(taskKeys.all, [
            ...previousTasks,
            optimisticHighlight,
          ]);
        }
      }

      return { previousHighlight, previousTasks, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Highlight saved", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: taskKeys.highlight(dateStr) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      emitInvalidateQueries(["tasks"]);
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousHighlight !== undefined) {
        queryClient.setQueryData(
          taskKeys.highlight(dateStr),
          context.previousHighlight
        );
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
      toast.error("Failed to save highlight", { id: context?.toastId });
      console.error(error);
    },
  });
}

// Hook to save daily ritual (when user clicks "Start my day")
export function useSaveDailyRitualMutation(date: Date) {
  const queryClient = useQueryClient();
  const dateStr = format(date, "yyyy-MM-dd");

  return useMutation({
    mutationFn: (data: { highlightId?: string | null; timeline?: string[] }) =>
      ApiClient.post<DailyRitual>("/api/daily-ritual", { ...data, date: dateStr }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyRitualKeys.byDate(dateStr) });
    },
    onError: (error) => {
      toast.error("Failed to save daily ritual");
      console.error(error);
    },
  });
}
