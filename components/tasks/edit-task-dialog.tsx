"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronRight, X, Trash2 } from "lucide-react";
import { deadlineTypeLabels } from "@/lib/task-utils";
import { format } from "date-fns";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
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
  const [showMore, setShowMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="sm:max-w-[600px] p-0 gap-0 border-0 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Main input area */}
            <div className="pt-2 pb-4">
              <Input
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="mx-2 text-lg bg-transparent border-0 focus-visible:ring-offset-0 focus-visible:ring-0 px-0 text-foreground placeholder:text-muted-foreground font-medium"
              />

              {/* Expanded options */}
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 px-4 pt-4 mt-4 border-t overflow-hidden"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-secondary/30 border-t">
              {/* Left side - Timing */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                
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
                      <X className="h-3 w-3" />
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
              </div>

              {/* Right side - Show more */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMore(!showMore)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {showMore ? "Show less" : "Show more"}
                <ChevronRight
                  className={`h-3 w-3 ml-1 transition-transform ${
                    showMore ? "rotate-90" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Action buttons - outside modal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute -bottom-16 right-0 flex gap-2"
            >
              <Button
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                variant="destructive"
                className="shadow-lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={() => handleSubmit()}
                disabled={!title.trim() || isSubmitting || isDeleting}
                className="shadow-lg"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Help text at bottom of screen - outside modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
            className="pointer-events-none"
          >
            <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">esc</kbd>
              <span className="mx-1">to cancel</span>
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ enter</kbd>
              <span className="mx-1">or</span>
              <span className="text-foreground font-medium">save</span>
              <span className="mx-1">to update</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
