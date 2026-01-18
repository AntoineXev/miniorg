"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Link as LinkIcon, Trash2, CheckCircle2, ArrowRight, Loader2, Download } from "lucide-react";
import { formatTimeRange, formatDuration, calculateDuration } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { emitTaskUpdate } from "@/lib/task-events";
import { useToast } from "@/components/ui/toast-provider";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  taskId?: string | null;
  color?: string | null;
  isCompleted: boolean;
  source: string;
  task?: {
    id: string;
    title: string;
    status: string;
    tags?: Array<{ id: string; name: string; color: string }>;
  } | null;
};

type EventDetailDialogProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onEventUpdated,
  onEventDeleted,
}: EventDetailDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const { pushSuccess, pushError } = useToast();

  if (!event) return null;

  const duration = calculateDuration(event.startTime, event.endTime);
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const isExternal = event.source !== "miniorg";
  // Allow conversion/import for all events that don't have a linked task yet
  const canConvertToTask = !event.taskId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/calendar-events?id=${event.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onEventDeleted?.();
        onOpenChange(false);
        // If event was linked to a task, notify other components
        if (event.taskId) {
          emitTaskUpdate();
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    setIsTogglingComplete(true);
    try {
      const response = await fetch("/api/calendar-events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          isCompleted: !event.isCompleted,
        }),
      });

      if (response.ok) {
        onEventUpdated?.();
      }
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  const handleConvertToTask = async () => {
    setIsConverting(true);
    try {
      // Create a new task from the event
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          description: event.description || undefined,
          scheduledDate: event.startTime.toISOString(),
          duration: duration,
          status: "planned",
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await taskResponse.json();

      // For both external and miniorg events, just link the existing event to the new task
      const eventResponse = await fetch("/api/calendar-events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          taskId: newTask.id,
        }),
      });

      if (!eventResponse.ok) {
        throw new Error("Failed to link event to task");
      }

      onEventUpdated?.();
      emitTaskUpdate(); // Notify other components that a task was created
      onOpenChange(false); // Close the dialog after successful import
      
      // Show success message
      if (isExternal) {
        pushSuccess(
          "Event imported successfully",
          "A new task has been created and linked to this event"
        );
      } else {
        pushSuccess(
          "Event converted to task",
          "Your event is now linked to a task"
        );
      }
    } catch (error) {
      console.error("Error converting/importing event to task:", error);
      pushError(
        "Failed to create task",
        "Please try again or contact support if the problem persists"
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event color indicator */}
          {event.color && (
            <div 
              className="h-1 w-full rounded-full -mt-2"
              style={{ backgroundColor: event.color }}
            />
          )}

          {/* Title */}
          <div>
            <h3 className={cn(
              "text-xl font-semibold",
              event.isCompleted && "line-through text-muted-foreground"
            )}>
              {event.title}
            </h3>
          </div>

          {/* Time and Duration */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{timeRange}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {formatDuration(duration)}
            </Badge>
            {event.isCompleted && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className="text-sm text-muted-foreground">
            {format(event.startTime, "EEEE, MMMM d, yyyy")}
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Source badge for external events */}
          {isExternal && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                From {event.source}
              </Badge>
            </div>
          )}

          {/* Linked Task Info */}
          {event.taskId && event.task && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <span>Linked to Task</span>
              </div>
              <div>
                <p className="font-medium">{event.task.title}</p>
                <Badge variant="secondary" className="text-xs mt-2 capitalize">
                  {event.task.status}
                </Badge>
                {event.task.tags && event.task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.task.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4 border-t">
            {/* Import/Convert to Task button - works for both miniorg and external events */}
            {canConvertToTask && (
              <Button
                variant="outline"
                onClick={handleConvertToTask}
                disabled={isConverting}
                className="w-full"
              >
                {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExternal ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import as Task
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Convert to Task
                  </>
                )}
              </Button>
            )}

            {/* Toggle Complete - only for miniorg events */}
            {!isExternal && (
              <Button
                variant={event.isCompleted ? "outline" : "default"}
                onClick={handleToggleComplete}
                disabled={isTogglingComplete}
                className="w-full"
              >
                {isTogglingComplete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {event.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
              </Button>
            )}

            {/* Delete - only for miniorg events */}
            {!isExternal && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
