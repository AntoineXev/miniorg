"use client";

import { useState, useEffect } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Link as LinkIcon, Trash2, CheckCircle2, ArrowRight, Loader2, Download } from "lucide-react";
import { formatTimeRange, formatDuration, calculateDuration } from "@/lib/utils/calendar";
import { cn } from "@/lib/utils";
import { useUpdateEventMutation, useDeleteEventMutation } from "@/lib/api/mutations/calendar-events";
import { useCreateTaskMutation } from "@/lib/api/mutations/tasks";
import type { CalendarEvent } from "@/lib/api/types";
import { toast } from "sonner";

type EventDetailDialogProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: (updatedEvent: CalendarEvent) => void;
  onEventDeleted?: () => void;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  onEventUpdated,
  onEventDeleted,
}: EventDetailDialogProps) {
  const [showDetails, setShowDetails] = useState(true); // Start expanded
  const [localEvent, setLocalEvent] = useState(event);

  const updateEvent = useUpdateEventMutation();
  const deleteEvent = useDeleteEventMutation();
  const createTask = useCreateTaskMutation();
  const isDeleting = deleteEvent.isPending;
  const isConverting = createTask.isPending;
  const isTogglingComplete = updateEvent.isPending;

  // Sync local event with prop
  useEffect(() => {
    if (event) {
      setLocalEvent(event);
    }
  }, [event]);

  if (!event || !localEvent) return null;

  // Normalize dates to Date objects
  const startTime = typeof localEvent.startTime === 'string' ? new Date(localEvent.startTime) : localEvent.startTime;
  const endTime = typeof localEvent.endTime === 'string' ? new Date(localEvent.endTime) : localEvent.endTime;

  const duration = calculateDuration(startTime, endTime);
  const timeRange = formatTimeRange(startTime, endTime);
  const isExternal = localEvent.source !== "miniorg";
  // Allow conversion/import for all events that don't have a linked task yet
  const canConvertToTask = !localEvent.taskId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    deleteEvent.mutate(localEvent.id, {
      onSuccess: () => {
        onEventDeleted?.();
        onOpenChange(false);
      },
    });
  };

  const handleCheckboxChange = async (checked: boolean) => {
    // Optimistically update the local state immediately for instant UI feedback
    setLocalEvent(prev => prev ? { ...prev, isCompleted: checked } : prev);
    
    updateEvent.mutate({
      id: localEvent.id,
      isCompleted: checked,
    }, {
      onSuccess: (updatedEvent) => {
        // Parse dates
        const parsedEvent = {
          ...updatedEvent,
          startTime: typeof updatedEvent.startTime === 'string' ? new Date(updatedEvent.startTime) : updatedEvent.startTime,
          endTime: typeof updatedEvent.endTime === 'string' ? new Date(updatedEvent.endTime) : updatedEvent.endTime,
        };
        
        // Update local state with full response (including taskId if auto-imported)
        setLocalEvent(parsedEvent);
        onEventUpdated?.(parsedEvent);
        
        // Show success message for auto-import
        if (checked && !localEvent.taskId) {
          toast.success(
            "Event completed and imported",
            {
              description: "A new task has been created and marked as done"
            }
          );
        }
      },
      onError: () => {
        // Revert optimistic update on error
        setLocalEvent(prev => prev ? { ...prev, isCompleted: !checked } : prev);
        toast.error(
          "Failed to update event",
          {
            description: "Please try again or contact support if the problem persists"
          }
        );
      },
    });
  };

  const handleConvertToTask = async () => {
    createTask.mutate({
      title: localEvent.title,
      description: localEvent.description || undefined,
      scheduledDate: startTime,
      duration: duration,
    }, {
      onSuccess: (newTask) => {
        // Now link the event to the task
        updateEvent.mutate({
          id: localEvent.id,
          taskId: newTask.id,
        }, {
          onSuccess: (updatedEvent) => {
            // Parse dates
            const parsedEvent = {
              ...updatedEvent,
              startTime: typeof updatedEvent.startTime === 'string' ? new Date(updatedEvent.startTime) : updatedEvent.startTime,
              endTime: typeof updatedEvent.endTime === 'string' ? new Date(updatedEvent.endTime) : updatedEvent.endTime,
            };

            // Update local state
            setLocalEvent(parsedEvent);
            onEventUpdated?.(parsedEvent);
            onOpenChange(false); // Close the dialog after successful import
            
            // Show success message
            if (isExternal) {
              toast.success(
                "Event imported successfully",
                {
                  description: "A new task has been created and linked to this event"
                }
              );
            } else {
              toast.success(
                "Event converted to task",
                {
                  description: "Your event is now linked to a task"
                }
              );
            }
          },
          onError: () => {
            toast.error(
              "Failed to link event to task",
              {
                description: "Please try again or contact support if the problem persists"
              }
            );
          },
        });
      },
      onError: () => {
        toast.error(
          "Failed to create task",
          {
            description: "Please try again or contact support if the problem persists"
          }
        );
      },
    });
  };

  return (
    <UnifiedModal
      open={open}
      onOpenChange={onOpenChange}
      headerValue={localEvent.title}
      headerDisabled={true}
      showCheckbox={!isExternal}
      checkboxChecked={localEvent.isCompleted}
      onCheckboxChange={!isExternal ? handleCheckboxChange : undefined}
      showMoreExpanded={showDetails}
      onShowMoreToggle={setShowDetails}
      footerLeftActions={
        <div className="flex items-center gap-2">
          {/* Source badge for external events */}
          {isExternal && (
            <Badge variant="secondary" className="capitalize text-xs">
              From {localEvent.source}
            </Badge>
          )}
          
          {/* Completed badge */}
          {localEvent.isCompleted && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={1} />
              Completed
            </Badge>
          )}
        </div>
      }
      actionButtons={
        <>
          {/* Delete - only for miniorg events */}
          {!isExternal && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="shadow-lg bg-white border border-red-600 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" strokeWidth={1} />
              ) : (
                <Trash2 className="h-4 w-4 text-red-600" strokeWidth={1} />
              )}
            </Button>
          )}

          {/* Import/Convert to Task button */}
          {canConvertToTask && (
            <Button
              variant="default"
              onClick={handleConvertToTask}
              disabled={isConverting}
              className="shadow-lg"
            >
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1} />}
              {isExternal ? (
                <>
                  <Download className="mr-2 h-4 w-4" strokeWidth={1} />
                  Import
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" strokeWidth={1} />
                  Add to Tasks
                </>
              )}
            </Button>
          )}
        </>
      }
    >
      {/* Event color indicator */}
      {localEvent.color && (
        <div 
          className="h-1 w-full rounded-full -mb-2"
          style={{ backgroundColor: localEvent.color }}
        />
      )}

      {/* Time and Duration */}
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
          <span className="font-medium">{timeRange}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {formatDuration(duration)}
        </Badge>
      </div>

      {/* Date */}
      <div className="text-sm text-muted-foreground">
        {format(startTime, "EEEE, MMMM d, yyyy")}
      </div>

      {/* Description */}
      {localEvent.description && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {localEvent.description}
          </p>
        </div>
      )}

      {/* Linked Task Info */}
      {localEvent.taskId && localEvent.task && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="h-4 w-4 text-blue-600" strokeWidth={1} />
            <span>Linked to Task</span>
          </div>
          <div>
            <p className="font-medium text-sm">{localEvent.task.title}</p>
            <Badge variant="secondary" className="text-xs mt-2 capitalize">
              {localEvent.task.status}
            </Badge>
            {localEvent.task.tag && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: `${localEvent.task.tag.color}20`, color: localEvent.task.tag.color }}
                  className="text-xs"
                >
                  {localEvent.task.tag.name}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </UnifiedModal>
  );
}
