"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addMinutes } from "date-fns";
import { Loader2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  duration?: number | null;
};

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);

  // Fetch tasks when linking option is enabled
  useEffect(() => {
    if (linkToTask && tasks.length === 0) {
      fetchTasks();
    }
  }, [linkToTask]);

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

  const fetchTasks = async () => {
    setIsFetchingTasks(true);
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        // Filter to only show non-completed tasks
        const activeTasks = data.filter((t: any) => t.status !== "done");
        setTasks(activeTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsFetchingTasks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !startTime || !endTime) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          taskId: linkToTask && selectedTaskId ? selectedTaskId : null,
        }),
      });

      if (response.ok) {
        onEventCreated?.();
        handleClose();
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Calendar Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          {/* Link to Task */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linkToTask"
                checked={linkToTask}
                onCheckedChange={(checked) => setLinkToTask(checked as boolean)}
              />
              <Label htmlFor="linkToTask" className="cursor-pointer font-normal">
                Link to existing task
              </Label>
            </div>

            {linkToTask && (
              <div className="space-y-2 pl-6">
                {isFetchingTasks ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tasks...
                  </div>
                ) : tasks.length > 0 ? (
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger>
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
