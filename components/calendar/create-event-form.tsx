"use client";

import { useState, useEffect, useCallback } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addMinutes } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useCreateEventMutation } from "@/lib/api/mutations/calendar-events";
import type { Task } from "@/lib/api/types";

type CreateEventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledStartTime?: Date;
  prefilledEndTime?: Date;
  onEventCreated?: () => void;
};

export function CreateEventForm({
  open,
  onOpenChange,
  prefilledStartTime,
  prefilledEndTime,
  onEventCreated,
}: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [linkToTask, setLinkToTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const { data: allTasks = [], isLoading: isFetchingTasks } = useTasksQuery();
  const createEvent = useCreateEventMutation();
  const isLoading = createEvent.isPending;

  // Filter to only show non-completed tasks
  const tasks = allTasks.filter((t: Task) => t.status !== "done");

  // Set prefilled times when dialog opens
  useEffect(() => {
    if (open && prefilledStartTime) {
      setStartTime(format(prefilledStartTime, "yyyy-MM-dd'T'HH:mm"));
      
      if (prefilledEndTime) {
        setEndTime(format(prefilledEndTime, "yyyy-MM-dd'T'HH:mm"));
      } else {
        // Default to 30 minutes after start
        const defaultEnd = addMinutes(prefilledStartTime, 30);
        setEndTime(format(defaultEnd, "yyyy-MM-dd'T'HH:mm"));
      }
    }
  }, [open, prefilledStartTime, prefilledEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !startTime || !endTime) {
      return;
    }

    const isLinkingToTask = linkToTask && selectedTaskId;
    createEvent.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      taskId: isLinkingToTask ? selectedTaskId : null,
    }, {
      onSuccess: () => {
        onEventCreated?.();
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setLinkToTask(false);
    setSelectedTaskId("");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(new Event("submit") as any);
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <UnifiedModal
      open={open}
      onOpenChange={handleClose}
      headerValue={title}
      headerPlaceholder="Event title"
      onHeaderChange={setTitle}
      onKeyDown={handleKeyDown}
      footerLeftActions={<></>}
      actionButtons={
          <Button 
            type="button" 
            onClick={(e) => handleSubmit(e as any)} 
            disabled={isLoading || !title.trim() || !startTime || !endTime}
            className="shadow-lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1} />}
            Create Event
          </Button>
      }
      keyboardHints={
        <>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">esc</kbd>
          <span className="mx-1">to cancel</span>
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ enter</kbd>
          <span className="mx-1">or</span>
          <span className="text-foreground font-medium">create</span>
          <span className="mx-1">to save</span>
        </>
      }
    >
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Description
        </label>
        <textarea
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Start Time
        </label>
        <Input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          End Time
        </label>
        <Input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="linkToTask"
            checked={linkToTask}
            onCheckedChange={(checked) => setLinkToTask(checked as boolean)}
          />
          <Label htmlFor="linkToTask" className="cursor-pointer font-normal text-xs text-muted-foreground">
            Link to existing task
          </Label>
        </div>

        {linkToTask && (
          <div className="space-y-2 pl-6">
            {isFetchingTasks ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1} />
                Loading tasks...
              </div>
            ) : tasks.length > 0 ? (
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No active tasks found</p>
            )}
          </div>
        )}
      </div>
    </UnifiedModal>
  );
}
