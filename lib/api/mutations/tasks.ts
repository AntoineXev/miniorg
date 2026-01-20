import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { taskKeys } from "../queries/tasks";
import { calendarEventKeys } from "../queries/calendar-events";
import type { Task, TaskInput } from "../types";

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
          previousTasks.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        );
      }

      return { previousTasks, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Task updated", { id: context?.toastId });
      // Invalidate both tasks and events (they're linked)
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
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
