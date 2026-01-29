"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { format, startOfDay, endOfDay, isSameDay, parseISO, addMinutes, differenceInMinutes, isPast } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavButton } from "@/components/ui/nav-button";
import { CreateEventForm } from "./create-event-form";
import { EventDetailDialog } from "./event-detail-dialog";
import { cn } from "@/lib/utils";
import styles from "./fullcalendar-timeline.module.css";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useCalendarEventsQuery, calendarEventKeys } from "@/lib/api/queries/calendar-events";
import { useCreateEventMutation, useUpdateEventMutation } from "@/lib/api/mutations/calendar-events";
import type { CalendarEvent } from "@/lib/api/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "@/components/ui/loader";
import { ApiClient } from "@/lib/api/client";
import { getEventColor, getEventBackgroundColor, EVENT_COLOR_TASK, EVENT_OPACITY } from "@/lib/utils/event-colors";
import { useTimelineDrag } from "@/lib/contexts/timeline-drag-context";
import {
  SLOT_HEIGHT_PX,
  SLOT_DURATION_MINUTES,
  SNAP_INTERVAL_MINUTES,
  DAY_START_HOUR,
  DAY_END_HOUR,
  DEFAULT_EVENT_DURATION_MINUTES,
  COMPACT_EVENT_THRESHOLD_MINUTES,
} from "@/lib/constants/calendar";
import { useTimelineDate } from "@/lib/contexts/timeline-date-context";

// FullCalendar imports
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, EventContentArg } from "@fullcalendar/core";
import type { EventResizeDoneArg, DateClickArg } from "@fullcalendar/interaction";

type FullCalendarTimelineProps = {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  startHour?: number;
  endHour?: number;
  slotInterval?: number;
};

type DraggedTask = {
  taskId: string;
  title: string;
  duration: number;
  startTime: Date;
  endTime: Date;
};

export function FullCalendarTimeline({
  selectedDate: selectedDateProp,
  onDateChange,
  startHour = DAY_START_HOUR,
  endHour = DAY_END_HOUR,
  slotInterval = SLOT_DURATION_MINUTES,
}: FullCalendarTimelineProps) {
  // Use context date if no prop provided
  const { selectedDate: contextDate, setSelectedDate: setContextDate } = useTimelineDate();
  const initialDate = selectedDateProp ?? contextDate;

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [prefilledStartTime, setPrefilledStartTime] = useState<Date | undefined>();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const { setIsOverTimeline } = useTimelineDrag();

  const slotHeight = SLOT_HEIGHT_PX;
  const snapInterval = SNAP_INTERVAL_MINUTES;

  // Sync with context date when it changes externally
  useEffect(() => {
    if (!selectedDateProp && contextDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(contextDate);
      calendarRef.current?.getApi().gotoDate(contextDate);
    }
  }, [contextDate, selectedDateProp, currentDate]);

  // Resize FullCalendar when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update context when navigating (if not using prop)
  const updateCurrentDate = useCallback((date: Date) => {
    setCurrentDate(date);
    if (!selectedDateProp) {
      setContextDate(date);
    }
    onDateChange?.(date);
  }, [selectedDateProp, setContextDate, onDateChange]);

  // Use React Query hooks
  const startDate = useMemo(() => startOfDay(currentDate).toISOString(), [currentDate]);
  const endDate = useMemo(() => endOfDay(currentDate).toISOString(), [currentDate]);

  const { data: rawEvents = [], isLoading } = useCalendarEventsQuery({
    startDate,
    endDate,
  });

  const queryClient = useQueryClient();
  const createEvent = useCreateEventMutation();
  const updateEvent = useUpdateEventMutation();

  // Parse events for FullCalendar
  const events = useMemo(() => {
    const parsedEvents = rawEvents.map((event: CalendarEvent) => {
      const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
      const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
      const isPastEvent = isPast(end);
      const eventColor = getEventColor(event);
      const backgroundColor = getEventBackgroundColor(event, isPastEvent);

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        allDay: event.isAllDay ?? false,
        backgroundColor,
        borderColor: 'transparent',
        textColor: '#ffffff',
        extendedProps: {
          ...event,
          startTime: start,
          endTime: end,
          eventColor,
          isPastEvent,
        },
      };
    });

    // Add ghost event when dragging from backlog
    if (draggedTask) {
      parsedEvents.push({
        id: 'drag-preview',
        title: draggedTask.title,
        start: draggedTask.startTime,
        end: draggedTask.endTime,
        allDay: false,
        backgroundColor: `hsla(17, 78%, 62%, ${EVENT_OPACITY.PAST})`,
        borderColor: EVENT_COLOR_TASK,
        textColor: '#ffffff',
        extendedProps: {
          isPreview: true,
          startTime: draggedTask.startTime,
          endTime: draggedTask.endTime,
        } as any,
      });
    }

    return parsedEvents;
  }, [rawEvents, draggedTask]);

  // Trigger calendar sync when date changes
  useEffect(() => {
    const syncCalendars = async () => {
      try {
        await ApiClient.post('/api/calendar-sync', { startDate, endDate });
        queryClient.invalidateQueries({ queryKey: calendarEventKeys.all });
      } catch (syncError) {
        console.error('Calendar sync error:', syncError);
      }
    };
    syncCalendars();
  }, [startDate, endDate, queryClient]);

  // Calculate time from mouse Y position
  const getTimeFromMouseY = useCallback((yPosition: number): Date => {
    if (!containerRef.current) return new Date();

    const scrollContainer = containerRef.current.querySelector('.fc-scroller-liquid-absolute');
    if (!scrollContainer) return new Date();

    const rect = scrollContainer.getBoundingClientRect();
    const scrollTop = scrollContainer.scrollTop;
    const relativeY = yPosition - rect.top + scrollTop;

    const minutesFromStart = (relativeY / slotHeight) * slotInterval;
    const dayStart = startOfDay(currentDate);
    const timeWithoutSnap = addMinutes(dayStart, startHour * 60 + minutesFromStart);

    const minutes = timeWithoutSnap.getHours() * 60 + timeWithoutSnap.getMinutes();
    const snappedMinutes = Math.round(minutes / snapInterval) * snapInterval;

    return addMinutes(dayStart, snappedMinutes);
  }, [currentDate, slotHeight, slotInterval, startHour, snapInterval]);

  // Setup drag and drop for tasks from backlog
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cleanup = dropTargetForElements({
      element: el,
      getData: () => ({ timeline: true }),
      onDragEnter: ({ source, location }) => {
        const taskId = source.data.taskId as string;
        const taskTitle = source.data.taskTitle as string;
        const taskDuration = (source.data.taskDuration as number) || DEFAULT_EVENT_DURATION_MINUTES;

        const initialY = location.current.input.clientY;
        const startTime = getTimeFromMouseY(initialY);
        const endTime = addMinutes(startTime, taskDuration);

        setDraggedTask({
          taskId,
          title: taskTitle,
          duration: taskDuration,
          startTime,
          endTime,
        });

        // Notify drag preview to hide
        setIsOverTimeline(true);
      },
      onDrag: ({ location }) => {
        if (!draggedTask) return;

        const currentY = location.current.input.clientY;
        const startTime = getTimeFromMouseY(currentY);
        const endTime = addMinutes(startTime, draggedTask.duration);

        setDraggedTask(prev => prev ? { ...prev, startTime, endTime } : null);
      },
      onDragLeave: () => {
        setDraggedTask(null);
        // Notify drag preview to show again
        setIsOverTimeline(false);
      },
      onDrop: async ({ source, location }) => {
        const taskId = source.data.taskId as string;
        const taskTitle = source.data.taskTitle as string;
        const taskDuration = (source.data.taskDuration as number) || DEFAULT_EVENT_DURATION_MINUTES;

        // Notify drag preview to show again (cleanup)
        setIsOverTimeline(false);

        if (!taskId) {
          setDraggedTask(null);
          return;
        }

        const dropY = location.current.input.clientY;
        const finalStartTime = getTimeFromMouseY(dropY);
        const finalEndTime = addMinutes(finalStartTime, taskDuration);

        setDraggedTask(null);

        createEvent.mutate({
          title: taskTitle,
          startTime: finalStartTime.toISOString(),
          endTime: finalEndTime.toISOString(),
          taskId: taskId,
        }, {
          onSuccess: () => {
            toast.success(
              "Task successfully planned",
              {
                description: "You'll find your task in your calendar view"
              }
            );
          },
          onError: (error) => {
            console.error("Error creating event from task:", error);
          },
        });
      },
    });

    return cleanup;
  }, [draggedTask, getTimeFromMouseY, createEvent, setIsOverTimeline]);

  // Handle slot click to create new event
  const handleDateClick = useCallback((arg: DateClickArg) => {
    setPrefilledStartTime(arg.date);
    setIsCreateFormOpen(true);
  }, []);

  // Handle event click to open details
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = rawEvents.find((e: CalendarEvent) => e.id === arg.event.id);
    if (event) {
      const parsedEvent = {
        ...event,
        startTime: typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime,
        endTime: typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime,
      };
      setSelectedEvent(parsedEvent as CalendarEvent);
      setIsEventDetailOpen(true);
    }
  }, [rawEvents]);

  // Handle event drop (move)
  const handleEventDrop = useCallback((arg: EventDropArg) => {
    const { event } = arg;

    updateEvent.mutate({
      id: event.id,
      startTime: event.start!.toISOString(),
      endTime: event.end!.toISOString(),
    }, {
      onError: () => {
        arg.revert();
      },
    });
  }, [updateEvent]);

  // Handle event resize
  const handleEventResize = useCallback((arg: EventResizeDoneArg) => {
    const { event } = arg;

    updateEvent.mutate({
      id: event.id,
      startTime: event.start!.toISOString(),
      endTime: event.end!.toISOString(),
    }, {
      onError: () => {
        arg.revert();
      },
    });
  }, [updateEvent]);

  // Custom event content
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const { extendedProps } = eventInfo.event;
    const isPreview = extendedProps.isPreview;
    const isCompact = eventInfo.event.end && eventInfo.event.start
      ? differenceInMinutes(eventInfo.event.end, eventInfo.event.start) < COMPACT_EVENT_THRESHOLD_MINUTES
      : false;
    const isDragging = eventInfo.isDragging;
    const isResizing = eventInfo.isResizing;

    // Show time range for preview, dragging or resizing
    if (isPreview || isDragging || isResizing) {
      const start = eventInfo.event.start;
      const end = eventInfo.event.end;
      if (start && end) {
        return (
          <div className="fc-event-content h-full flex items-start px-1.5 py-1 overflow-hidden">
            <span className="text-xs font-bold text-white">
              {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
            </span>
          </div>
        );
      }
    }

    return (
      <div
        className={cn(
          "fc-event-content h-full flex items-start px-1.5 py-1 overflow-hidden"
        )}
      >
        <span
          className={cn(
            "font-medium leading-tight truncate text-white",
            isCompact ? "text-[11px]" : "text-xs"
          )}
        >
          {eventInfo.event.title}
        </span>
      </div>
    );
  }, []);

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    updateCurrentDate(newDate);
    calendarRef.current?.getApi().gotoDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    updateCurrentDate(newDate);
    calendarRef.current?.getApi().gotoDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    updateCurrentDate(today);
    calendarRef.current?.getApi().gotoDate(today);
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <NavButton
              size="sm"
              onClick={handlePreviousDay}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </NavButton>

            <div className="flex flex-col items-center">
              <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                {format(currentDate, "EEE")}
              </span>
              <span className={cn("text-2xl font-semibold", isToday && "text-primary")}>
                {format(currentDate, "d")}
              </span>
            </div>

            <NavButton
              size="sm"
              onClick={handleNextDay}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </NavButton>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div
        ref={containerRef}
        className={cn("flex-1 overflow-hidden relative", styles.container)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader showText text="Loading timeline" />
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridDay"
            initialDate={currentDate}
            headerToolbar={false}
            slotMinTime={`${String(startHour).padStart(2, '0')}:00:00`}
            slotMaxTime={`${String(endHour).padStart(2, '0')}:00:00`}
            slotDuration={`00:${String(slotInterval).padStart(2, '0')}:00`}
            snapDuration={`00:${String(snapInterval).padStart(2, '0')}:00`}
            slotLabelInterval={`01:00:00`}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            allDaySlot={true}
            allDayText=""
            nowIndicator={true}
            editable={true}
            eventStartEditable={true}
            eventDurationEditable={true}
            eventResizableFromStart={true}
            events={events}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            height="100%"
            dayHeaders={false}
            expandRows={true}
          />
        )}
      </div>

      {/* Create Event Form */}
      <CreateEventForm
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        prefilledStartTime={prefilledStartTime}
        onEventCreated={() => {}}
      />

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={isEventDetailOpen}
        onOpenChange={setIsEventDetailOpen}
        onEventUpdated={() => {}}
        onEventDeleted={() => {}}
      />
    </div>
  );
}
