"use client";

import { useState, useEffect } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, X, Trash2, Loader2 } from "lucide-react";
import { deadlineTypeLabels } from "@/lib/task-utils";
import { format } from "date-fns";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  duration?: number | null; // Duration in minutes
  completedAt?: Date | null;
  tags?: Array<{ id: string; name: string; color: string }>;
};

type EditTaskDialogProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
};

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineType, setDeadlineType] = useState<string>("next_3_days");
  const [specificDate, setSpecificDate] = useState<string>("");
  const [useSpecificDate, setUseSpecificDate] = useState(false);
  const [duration, setDuration] = useState<string>("30"); // Duration in minutes as string for input
  const [showMore, setShowMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDuration(task.duration?.toString() || "30");
      setIsCompleted(task.status === "done");
      
      if (task.scheduledDate) {
        setUseSpecificDate(true);
        // Format date for input[type="date"]
        const date = new Date(task.scheduledDate);
        setSpecificDate(format(date, "yyyy-MM-dd"));
      } else {
        setUseSpecificDate(false);
        setDeadlineType(task.deadlineType || "next_3_days");
      }
      
      // Always expand "show more" by default
      setShowMore(true);
    }
  }, [task]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !task) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          deadlineType: useSpecificDate ? null : (deadlineType || null),
          scheduledDate: useSpecificDate && specificDate ? new Date(specificDate).toISOString() : null,
          duration: duration ? parseInt(duration, 10) : null,
          status: isCompleted ? "done" : task.status,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        onTaskUpdated?.();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = async (checked: boolean) => {
    if (!task) return;
    
    setIsCompleted(checked);
    
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: checked ? "done" : "planned",
        }),
      });

      if (response.ok) {
        onTaskUpdated?.();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert on error
      setIsCompleted(!checked);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onOpenChange(false);
        onTaskDeleted?.();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  if (!task) return null;

  return (
    <UnifiedModal
      open={open}
      onOpenChange={onOpenChange}
      headerValue={title}
      headerPlaceholder="Task title"
      onHeaderChange={setTitle}
      onKeyDown={handleKeyDown}
      showCheckbox={true}
      checkboxChecked={isCompleted}
      onCheckboxChange={handleCheckboxChange}
      showMoreExpanded={showMore}
      onShowMoreToggle={setShowMore}
      footerLeftActions={
        <>
          <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
          
          {useSpecificDate ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="h-8 text-sm w-auto"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseSpecificDate(false);
                  setSpecificDate("");
                }}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" strokeWidth={1} />
              </Button>
            </div>
          ) : (
            <>
              <Select value={deadlineType} onValueChange={setDeadlineType}>
                <SelectTrigger className="h-8 text-sm border-0 focus:ring-0 w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next_3_days">{deadlineTypeLabels.next_3_days}</SelectItem>
                  <SelectItem value="next_week">{deadlineTypeLabels.next_week}</SelectItem>
                  <SelectItem value="next_month">{deadlineTypeLabels.next_month}</SelectItem>
                  <SelectItem value="next_quarter">{deadlineTypeLabels.next_quarter}</SelectItem>
                  <SelectItem value="next_year">{deadlineTypeLabels.next_year}</SelectItem>
                  <SelectItem value="no_date">{deadlineTypeLabels.no_date}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseSpecificDate(true)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Set date
              </Button>
            </>
          )}

          <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-8 text-sm border-0 focus:ring-0 w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      }
      actionButtons={
        <>
          <Button
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            variant="ghost"
            className="shadow-lg bg-white border border-red-600 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" strokeWidth={1} />
            ) : (
              <Trash2 className="h-4 w-4 text-red-600" strokeWidth={1} />
            )}
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={!title.trim() || isSubmitting || isDeleting}
            className="shadow-lg"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </>
      }
      keyboardHints={
        <>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">esc</kbd>
          <span className="mx-1">to cancel</span>
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ enter</kbd>
          <span className="mx-1">or</span>
          <span className="text-foreground font-medium">save</span>
          <span className="mx-1">to update</span>
        </>
      }
    >
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Description
        </label>
        <textarea
          placeholder="Add more details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Tags
        </label>
        <Input
          placeholder="Coming soon..."
          disabled
          className="h-9 text-sm"
        />
      </div>
    </UnifiedModal>
  );
}
