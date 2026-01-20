"use client";

import { useState, useEffect } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Clock, Trash2, Loader2 } from "lucide-react";
import { deadlineTypeLabels } from "@/lib/utils/task";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { TagAutocomplete } from "@/components/tags/tag-autocomplete";
import { TagSelector } from "@/components/tags/tag-selector";
import type { Task, Tag } from "@/lib/api/types";

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
  const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined);
  const [useSpecificDate, setUseSpecificDate] = useState(false);
  const [duration, setDuration] = useState<string>("30"); // Duration in minutes as string for input
  const [showMore, setShowMore] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const isSubmitting = updateTask.isPending;
  const isDeleting = deleteTask.isPending;

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDuration(task.duration?.toString() || "30");
      setIsCompleted(task.status === "done");
      setSelectedTag(task.tag as Tag || null);
      
      if (task.scheduledDate) {
        setUseSpecificDate(true);
        const date = new Date(task.scheduledDate);
        setSpecificDate(date);
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

    updateTask.mutate({
      id: task.id,
      title: title.trim(),
      description: description.trim() || null,
      deadlineType: useSpecificDate ? null : (deadlineType || null),
      scheduledDate: useSpecificDate && specificDate ? specificDate : null,
      duration: duration ? parseInt(duration, 10) : null,
      status: isCompleted ? "done" : task.status,
      tagId: selectedTag?.id || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        onTaskUpdated?.();
      },
    });
  };

  const handleSelectTag = (tag: Tag | null) => {
    setSelectedTag(tag);
  };

  const handleCheckboxChange = async (checked: boolean) => {
    if (!task) return;
    
    setIsCompleted(checked);
    
    const updatePayload: any = {
      id: task.id,
    };
    
    // Only set status when marking as done
    // When unchecking, omit status entirely to let backend auto-determine it
    if (checked) {
      updatePayload.status = "done";
    }
    
    updateTask.mutate(updatePayload, {
      onSuccess: () => {
        onTaskUpdated?.();
      },
      onError: () => {
        // Revert on error
        setIsCompleted(!checked);
      },
    });
  };

  const handleDelete = async () => {
    if (!task) return;
    
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    deleteTask.mutate(task.id, {
      onSuccess: () => {
        onOpenChange(false);
        onTaskDeleted?.();
      },
    });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Allow Enter in description without submitting
      return;
    }
  };

  if (!task) return null;

  return (
    <UnifiedModal
      open={open}
      onOpenChange={onOpenChange}
      headerValue={title}
      headerPlaceholder="Task title"
      customHeader={
        <TagAutocomplete
          value={title}
          onChange={setTitle}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
          placeholder="Task title"
          onKeyDown={handleTitleKeyDown}
        />
      }
      showCheckbox={true}
      checkboxChecked={isCompleted}
      onCheckboxChange={handleCheckboxChange}
      showMoreExpanded={showMore}
      onShowMoreToggle={setShowMore}
      footerLeftActions={
        <div className="flex items-center w-full">
          {useSpecificDate ? (
            <DatePicker
              date={specificDate}
              onDateChange={setSpecificDate}
              onClear={() => {
                setUseSpecificDate(false);
                setSpecificDate(undefined);
              }}
              placeholder="Pick a date"
            />
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

          <div className="flex items-center gap-2 ml-3 border-l border-border pl-3">
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
          <div className="flex items-center gap-2 ml-3 border-l border-border pl-3">
            <TagSelector
              selectedTag={selectedTag}
              onSelectTag={handleSelectTag}
              showNoTagOption={true}
            />
          </div>
        </div>
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
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">enter</kbd>
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
          onKeyDown={handleDescriptionKeyDown}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

    </UnifiedModal>
  );
}
