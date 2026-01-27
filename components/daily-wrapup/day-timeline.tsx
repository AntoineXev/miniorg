"use client";

import { useMemo } from "react";
import type { Task, CalendarEvent } from "@/lib/api/types";
import { isSameDay, parseISO, format } from "date-fns";
import { GoogleCalendarIcon } from "@/components/icons/google-calendar-icon";
import { OutlookCalendarIcon } from "@/components/icons/outlook-calendar-icon";
import { MiniorgIcon } from "@/components/icons/miniorg-icon";
import { Badge } from "@/components/ui/badge";

type DayTimelineProps = {
  tasks: Task[];
  events: CalendarEvent[];
  date: Date;
};

type TimelineItem = {
  id: string;
  type: "task" | "event";
  title: string;
  description?: string | null;
  startTime: Date | null;
  endTime: Date | null;
  isCompleted: boolean;
  color?: string;
  tagName?: string;
  source?: "miniorg" | "google" | "outlook" | string;
};

// Source icon component
function SourceIcon({ source }: { source?: string }) {
  if (source === "google") {
    return <GoogleCalendarIcon size={18} />;
  }
  if (source === "outlook") {
    return <OutlookCalendarIcon size={18} />;
  }
  return <MiniorgIcon size={18} />;
}

export function DayTimeline({ tasks, events, date }: DayTimelineProps) {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add events from calendar
    events
      .filter((event) => {
        const eventStart = typeof event.startTime === "string"
          ? parseISO(event.startTime)
          : event.startTime;
        return isSameDay(eventStart, date);
      })
      .forEach((event) => {
        const startTime = typeof event.startTime === "string"
          ? parseISO(event.startTime)
          : event.startTime;
        const endTime = typeof event.endTime === "string"
          ? parseISO(event.endTime)
          : event.endTime;

        items.push({
          id: event.id,
          type: "event",
          title: event.title,
          description: event.description,
          startTime,
          endTime,
          isCompleted: event.isCompleted || false,
          color: event.color || event.task?.tag?.color || "#9ca3af",
          tagName: event.task?.tag?.name,
          source: event.source || "miniorg",
        });
      });

    // Add tasks with calendar events (they have specific times)
    tasks
      .filter((task) => {
        if (!task.calendarEvents || task.calendarEvents.length === 0) return false;
        return task.calendarEvents.some((ce) => {
          const eventStart = typeof ce.startTime === "string"
            ? parseISO(ce.startTime)
            : ce.startTime;
          return isSameDay(eventStart, date);
        });
      })
      .forEach((task) => {
        const todayEvent = task.calendarEvents?.find((ce) => {
          const eventStart = typeof ce.startTime === "string"
            ? parseISO(ce.startTime)
            : ce.startTime;
          return isSameDay(eventStart, date);
        });

        if (todayEvent) {
          const startTime = typeof todayEvent.startTime === "string"
            ? parseISO(todayEvent.startTime)
            : todayEvent.startTime;
          const endTime = typeof todayEvent.endTime === "string"
            ? parseISO(todayEvent.endTime)
            : todayEvent.endTime;

          // Check if this task's calendar event is not already in events list
          const existingEvent = events.find((e) => e.taskId === task.id);
          if (!existingEvent) {
            items.push({
              id: task.id,
              type: "task",
              title: task.title,
              description: task.description,
              startTime,
              endTime,
              isCompleted: task.status === "done",
              color: task.tag?.color || "#9ca3af",
              tagName: task.tag?.name,
              source: todayEvent.source || "miniorg",
            });
          }
        }
      });

    // Sort by start time
    items.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.getTime() - b.startTime.getTime();
    });

    return items;
  }, [tasks, events, date]);

  if (timelineItems.length === 0) {
    return (
      <div className="h-full">
        <h3 className="text-base font-semibold">Timeline</h3>
        <p className="text-sm font-light pt-2 text-muted-foreground mb-6">
          Your day at a glance
        </p>
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          No scheduled events for today
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto pt-2">
      <h3 className="text-base font-semibold">Timeline</h3>
      <p className="text-xs font-light italic pt-1 text-muted-foreground mb-4">
        Your day at a glance
      </p>

      <div className="relative">
        {/* Vertical timeline line - starts from first icon */}
        <div className="absolute left-[15px] top-[35px] bottom-0 w-0.5 bg-border z-10" />

        <div className="space-y-3">
          {timelineItems.map((item) => (
            <div key={item.id} className="relative group hover:bg-zinc-100 px-2 pt-2 flex items-end gap-2 rounded-lg">
              {/* Icon positioned on the timeline, aligned with title */}
              <div className="py-2 bg-background group-hover:bg-zinc-100 z-20">
                <SourceIcon source={item.source} />
              </div>

              {/* Content */}
              <div className="pb-2">
                {/* Time badge */}
                {item.startTime && (
                  <Badge variant="secondary" className="font-normal">
                    {format(item.startTime, "HH:mm")}
                    {item.endTime && ` - ${format(item.endTime, "HH:mm")}`}
                  </Badge>
                )}

                {/* Title */}
                <span className="font-semibold text-sm block mt-1">{item.title}</span>

                {/* Description if exists */}
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
