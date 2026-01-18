"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, ChevronRight, X } from "lucide-react";
import { deadlineTypeLabels } from "@/lib/task-utils";
import { format } from "date-fns";
import { useApiClient } from "@/lib/api-client";

type QuickAddTaskProps = {
  onTaskCreated?: () => void;
  prefilledDate?: Date;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function QuickAddTask({ onTaskCreated, prefilledDate, triggerOpen, onOpenChange }: QuickAddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineType, setDeadlineType] = useState<string>("next_3_days");
  const [specificDate, setSpecificDate] = useState<string>("");
  const [useSpecificDate, setUseSpecificDate] = useState(false);
  const [duration, setDuration] = useState<string>("30"); // Duration in minutes
  const [showMore, setShowMore] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useApiClient();

  // Gérer l'ouverture externe (depuis le bouton Add task d'une colonne)
  useEffect(() => {
    if (triggerOpen) {
      setOpen(true);
      if (prefilledDate) {
        setUseSpecificDate(true);
        setSpecificDate(format(prefilledDate, "yyyy-MM-dd"));
      }
      onOpenChange?.(true);
    }
  }, [triggerOpen, prefilledDate, onOpenChange]);

  // Gérer les changements d'état open
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDeadlineType("next_3_days");
    setSpecificDate("");
    setUseSpecificDate(false);
    setDuration("30");
    setShowMore(false);
    setDescription("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const data = await api.post<{ id: string }>(
      "/api/tasks",
      {
        title: title.trim(),
        description: description.trim() || undefined,
        deadlineType: useSpecificDate ? undefined : deadlineType,
        scheduledDate: useSpecificDate && specificDate ? new Date(specificDate).toISOString() : undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
        status: "backlog",
      },
      "Tâche créée",
      { errorMessage: "Erreur lors de la création" }
    );

    if (data) {
      resetForm();
      handleOpenChange(false);
      onTaskCreated?.();
    }

    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleOpenChange(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent hideClose className="sm:max-w-[600px] p-0 gap-0 border-0 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Main input area */}
            <div className="pt-4 pb-4">
              <Input
                placeholder="What do you need to do?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="px-4 ml-4 text-lg bg-transparent border-0 focus-visible:ring-offset-0 focus-visible:ring-0 px-0 text-foreground placeholder:text-muted-foreground font-medium"
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

                {/* Duration selector */}
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

            {/* Create button - outside modal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute -bottom-16 right-0"
            >
              <Button
                onClick={() => handleSubmit()}
                disabled={!title.trim() || isSubmitting}
                className="shadow-lg"
              >
                {isSubmitting ? "Creating..." : "Create task"}
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
              <span className="mx-1">or click outside to cancel</span>
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ enter</kbd>
              <span className="mx-1">or</span>
              <span className="text-foreground font-medium">create</span>
              <span className="mx-1">to save</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
