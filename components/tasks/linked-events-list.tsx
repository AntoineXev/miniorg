"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { EventDetailDialog } from "@/components/calendar/event-detail-dialog";
import { useDeleteEventMutation } from "@/lib/api/mutations/calendar-events";
import { formatDuration, calculateDuration } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/lib/api/types";

type LinkedEvent = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
};

type LinkedEventsListProps = {
  events: LinkedEvent[];
  onEventDeleted?: () => void;
};

export function LinkedEventsList({ events, onEventDeleted }: LinkedEventsListProps) {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const deleteEvent = useDeleteEventMutation();

  if (!events || events.length === 0) {
    return null;
  }

  const handleDelete = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingEventId(eventId);

    deleteEvent.mutate(eventId, {
      onSuccess: () => {
        setDeletingEventId(null);
        onEventDeleted?.();
      },
      onError: () => {
        setDeletingEventId(null);
      },
    });
  };

  const handleEdit = (event: LinkedEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    // Convert to CalendarEvent format for the dialog
    setEditingEvent({
      id: event.id,
      title: "",
      startTime: event.startTime,
      endTime: event.endTime,
      source: "miniorg",
    } as CalendarEvent);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground mb-1.5 block">
        Linked Events
      </label>
      <div className="space-y-1">
        {events.map((event) => {
          const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
          const endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
          const duration = calculateDuration(startTime, endTime);
          const isHovered = hoveredEventId === event.id;
          const isDeleting = deletingEventId === event.id;

          return (
            <div
              key={event.id}
              className="group relative flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              {/* Calendar icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-white" strokeWidth={2} />
                </div>
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {format(startTime, "EEEE, MMM d")}
                </div>
                <div className="text-sm text-foreground">
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(duration)}
                </div>
              </div>

              {/* Action buttons - show on hover */}
              {isHovered && !isDeleting && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <ButtonGroup>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => handleEdit(event, e)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(event.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </ButtonGroup>
                </div>
              )}

              {/* Loading state for delete */}
              {isDeleting && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event detail dialog for editing */}
      <EventDetailDialog
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onEventUpdated={() => setEditingEvent(null)}
        onEventDeleted={() => {
          setEditingEvent(null);
          onEventDeleted?.();
        }}
      />
    </div>
  );
}
