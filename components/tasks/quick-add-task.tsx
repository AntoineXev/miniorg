"use client";

import { useState, useEffect, useCallback } from "react";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Clock } from "lucide-react";
import { deadlineTypeLabels } from "@/lib/utils/task";
import { useQuickAddTask } from "@/providers/quick-add-task";
import { useCreateTaskMutation } from "@/lib/api/mutations/tasks";
import { TagAutocomplete } from "@/components/tags/tag-autocomplete";
import { TagSelector } from "@/components/tags/tag-selector";
import { useTagsQuery } from "@/lib/api/queries/tags";
import type { Tag } from "@/lib/api/types";

type QuickAddTaskProps = {
  onTaskCreated?: () => void;
  hideButton?: boolean;
  hideHints?: boolean;
  disableDatePickerPortal?: boolean;
};

export function QuickAddTask({ onTaskCreated, hideButton, hideHints, disableDatePickerPortal }: QuickAddTaskProps) {
  const { isOpen, prefilledDate, openQuickAdd, closeQuickAdd } = useQuickAddTask();
  const [title, setTitle] = useState("");
  const [deadlineType, setDeadlineType] = useState<string>("next_3_days");
  const [specificDate, setSpecificDate] = useState<Date | undefined>(undefined);
  const [useSpecificDate, setUseSpecificDate] = useState(false);
  const [duration, setDuration] = useState<string>("30"); // Duration in minutes
  const [showMore, setShowMore] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const createTask = useCreateTaskMutation();
  const { data: tags } = useTagsQuery();
  const isSubmitting = createTask.isPending;

  // Set default tag when modal opens
  useEffect(() => {
    if (isOpen && tags && tags.length > 0 && !selectedTag) {
      const defaultTag = tags.find((t) => t.isDefault && !t.parentId);
      if (defaultTag) {
        setSelectedTag(defaultTag);
      }
    }
  }, [isOpen, tags, selectedTag]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDeadlineType("next_3_days");
    setSpecificDate(undefined);
    setUseSpecificDate(false);
    setDuration("30");
    setShowMore(false);
    setDescription("");
    setSelectedTag(null);
  }, []);

  // Gérer les changements d'état open
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      openQuickAdd(prefilledDate);
    } else {
      closeQuickAdd();
      resetForm();
    }
  }, [openQuickAdd, closeQuickAdd, prefilledDate, resetForm]);

  // Gérer la date préfillee quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && prefilledDate) {
      setUseSpecificDate(true);
      setSpecificDate(prefilledDate);
    }
  }, [isOpen, prefilledDate]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        if (isOpen) {
          closeQuickAdd();
          resetForm();
        } else {
          openQuickAdd();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, openQuickAdd, closeQuickAdd, resetForm]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      deadlineType: useSpecificDate ? undefined : deadlineType,
      scheduledDate: useSpecificDate && specificDate ? specificDate : undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
      tagId: selectedTag?.id || null,
    }, {
      onSuccess: () => {
        resetForm();
        closeQuickAdd();
        onTaskCreated?.();
      },
    });
  };

  const handleSelectTag = (tag: Tag | null) => {
    setSelectedTag(tag);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      closeQuickAdd();
      resetForm();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Allow Enter in description without submitting
      return;
    }
  };

  return (
    <>
      {!hideButton && (
      <Button
        onClick={() => openQuickAdd()}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>)}

      <UnifiedModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        headerValue={title}
        headerPlaceholder="What do you need to do?"
        customHeader={
          <TagAutocomplete
            value={title}
            onChange={setTitle}
            selectedTag={selectedTag}
            onSelectTag={handleSelectTag}
            placeholder="What do you need to do?"
            onKeyDown={handleTitleKeyDown}
          />
        }
        showMoreExpanded={showMore}
        onShowMoreToggle={setShowMore}
        footerLeftActions={
          <>
            {useSpecificDate ? (
              <DatePicker
                date={specificDate}
                onDateChange={setSpecificDate}
                onClear={() => {
                  setUseSpecificDate(false);
                  setSpecificDate(undefined);
                }}
                placeholder="Pick a date"
                usePortal={!disableDatePickerPortal}
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
          </>
        }
        actionButtons={
          <Button
            onClick={() => handleSubmit()}
            disabled={!title.trim() || isSubmitting}
            className="shadow-lg"
          >
            {isSubmitting ? "Creating..." : "Create task"}
          </Button>
        }
        keyboardHints={
          !hideHints && (
          <>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">esc</kbd>
            <span className="mx-1">or click outside to cancel</span>
            <span className="mx-2">•</span>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">enter</kbd>
            <span className="mx-1">or</span>
            <span className="text-foreground font-medium">create</span>
            <span className="mx-1">to save</span>
          </>
          )
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
    </>
  );
}
