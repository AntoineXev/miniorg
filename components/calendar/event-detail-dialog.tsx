"use client";

import { useState, useEffect } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Trash2, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { formatTimeRange, formatDuration, calculateDuration } from "@/lib/utils/calendar";
import { useUpdateEventMutation, useDeleteEventMutation } from "@/lib/api/mutations/calendar-events";
import { useCreateTaskMutation } from "@/lib/api/mutations/tasks";
import { LinkedTaskDisplay } from "@/components/calendar/linked-task-display";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import type { CalendarEvent, Task } from "@/lib/api/types";
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateEvent = useUpdateEventMutation();
  const deleteEvent = useDeleteEventMutation();
  const createTask = useCreateTaskMutation();
  const isDeleting = deleteEvent.isPending;
  const isConverting = createTask.isPending;

  // Sync local event with prop and reset state
  useEffect(() => {
    if (event) {
      setLocalEvent(event);
    }
    setShowDeleteConfirm(false);
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    deleteEvent.mutate(localEvent.id, {
      onSuccess: () => {
        onEventDeleted?.();
        onOpenChange(false);
      },
    });
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
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
            toast.success(
              "Task created",
              {
                description: "Event is now linked to a task"
              }
            );
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
            showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Supprimer ?</span>
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1} />
                  ) : (
                    "Oui"
                  )}
                </Button>
                <Button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  variant="ghost"
                  size="sm"
                >
                  Non
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="shadow-lg bg-white border border-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 text-red-600" strokeWidth={1} />
              </Button>
            )
          )}

          {/* Add to Tasks button */}
          {canConvertToTask && (
            <Button
              variant="default"
              onClick={handleConvertToTask}
              disabled={isConverting}
              className="shadow-lg"
            >
              {isConverting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1} />
              ) : (
                <Plus className="mr-2 h-4 w-4" strokeWidth={1} />
              )}
              Add to Tasks
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
          <div
            className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1"
            dangerouslySetInnerHTML={{ __html: localEvent.description }}
          />
        </div>
      )}

      {/* Linked Task */}
      {localEvent.taskId && localEvent.task && (
        <LinkedTaskDisplay
          task={localEvent.task}
          event={localEvent}
          onTaskUpdated={(updatedTask, isCompleted) => {
            // Optimistically update local state
            setLocalEvent(prev => prev ? {
              ...prev,
              isCompleted,
              task: updatedTask,
            } : prev);
            onEventUpdated?.(localEvent);
          }}
          onTaskDeleted={() => {
            // Clear task link from local event
            setLocalEvent(prev => prev ? { ...prev, taskId: null, task: null } : prev);
          }}
          onEdit={(task) => setEditingTask(task)}
        />
      )}

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onTaskUpdated={() => {
          setEditingTask(null);
          onEventUpdated?.(localEvent);
        }}
        onTaskDeleted={() => {
          setEditingTask(null);
          setLocalEvent(prev => prev ? { ...prev, taskId: null, task: null } : prev);
        }}
      />
    </UnifiedModal>
  );
}
