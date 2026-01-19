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
    onMutate: async (newEvent) => {
      const toastId = toast.loading("Creating event...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarEventKeys.all });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(calendarEventKeys.all);

      // Optimistically add the new event
      if (previousEvents) {
        const optimisticEvent: CalendarEvent = {
          id: `temp-${Date.now()}`,
          title: newEvent.title || "",
          description: newEvent.description || null,
          startTime: newEvent.startTime || new Date(),
          endTime: newEvent.endTime || new Date(),
          taskId: newEvent.taskId || null,
          externalId: null,
          source: "miniorg",
          ...newEvent,
        } as CalendarEvent;

        queryClient.setQueryData<CalendarEvent[]>(calendarEventKeys.all, [...previousEvents, optimisticEvent]);
      }

      return { previousEvents, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Event created", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousEvents) {
        queryClient.setQueryData(calendarEventKeys.all, context.previousEvents);
      }
      toast.error("Failed to create event", { id: context?.toastId });
      console.error(error);
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CalendarEvent> & { id: string }) =>
      ApiClient.patch<CalendarEvent>("/api/calendar-events", data),
    onMutate: async (updatedEvent) => {
      const toastId = toast.loading("Updating event...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarEventKeys.all });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(calendarEventKeys.all);

      // Optimistically update the event
      if (previousEvents) {
        queryClient.setQueryData<CalendarEvent[]>(
          calendarEventKeys.all,
          previousEvents.map((event) =>
            event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
          )
        );
      }

      return { previousEvents, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Event updated", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousEvents) {
        queryClient.setQueryData(calendarEventKeys.all, context.previousEvents);
      }
      toast.error("Failed to update event", { id: context?.toastId });
      console.error(error);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) =>
      ApiClient.delete(`/api/calendar-events?id=${eventId}`),
    onMutate: async (eventId) => {
      const toastId = toast.loading("Deleting event...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarEventKeys.all });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(calendarEventKeys.all);

      // Optimistically remove the event
      if (previousEvents) {
        queryClient.setQueryData<CalendarEvent[]>(
          calendarEventKeys.all,
          previousEvents.filter((event) => event.id !== eventId)
        );
      }

      return { previousEvents, toastId };
    },
    onSuccess: (_, __, context) => {
      toast.success("Event deleted", { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error, _, context) => {
      // Rollback to previous state
      if (context?.previousEvents) {
        queryClient.setQueryData(calendarEventKeys.all, context.previousEvents);
      }
      toast.error("Failed to delete event", { id: context?.toastId });
      console.error(error);
    },
  });
}
