import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../client";
import { calendarEventKeys } from "../queries/calendar-events";
import { taskKeys } from "../queries/tasks";
import type { CalendarEvent } from "../types";

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CalendarEvent>) =>
      ApiClient.post<CalendarEvent>("/api/calendar-events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Event created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create event");
      console.error(error);
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CalendarEvent> & { id: string }) =>
      ApiClient.patch<CalendarEvent>("/api/calendar-events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Event updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update event");
      console.error(error);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) =>
      ApiClient.delete(`/api/calendar-events?id=${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete event");
      console.error(error);
    },
  });
}
