"use client";

import { useState, useEffect } from "react";
import { startOfDay } from "date-fns";
import { Crown, ArrowRight } from "lucide-react";
import { useDailyRitualQuery, useHighlightQuery } from "@/lib/api/queries/tasks";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { usePlatform } from "@/lib/hooks/use-platform";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/api/types";

const EmptyBanner = (isTauri: boolean) => {
  return (
    <div className={cn(isTauri ? "pt-6" : "pt-2")}>
    </div>
  );
};

export function DailyHighlightBanner() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [today, setToday] = useState(() => startOfDay(new Date()));
  const { isTauri } = usePlatform();

  // Update date when the day changes (check every minute)
  useEffect(() => {
    const checkDateChange = () => {
      const now = startOfDay(new Date());
      if (now.getTime() !== today.getTime()) {
        setToday(now);
      }
    };

    const interval = setInterval(checkDateChange, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [today]);

  // Check if daily ritual exists for today
  const { data: ritual, isLoading: isRitualLoading } = useDailyRitualQuery(today);

  // Get the highlight task details
  const { data: highlight, isLoading: isHighlightLoading } = useHighlightQuery(today);

  // Don't show banner if:
  // - Still loading
  // - No ritual (daily planning not done)
  // - No highlight
  if (isRitualLoading || isHighlightLoading) return EmptyBanner(isTauri);
  if (!ritual) return EmptyBanner(isTauri);
  if (!highlight) return EmptyBanner(isTauri);

  return (
    <div         data-tauri-drag-region={true}
    className="pb-2">
      <div
        data-tauri-drag-region={true}
        className={cn("w-full  text-primary-foreground px-2 py-1.5 flex items-center justify-center gap-2 transition-colors",
           highlight.status !== "done" ? "bg-primary" : "bg-green-500 hover:bg-green-500/90")}
      >
        <button
          className="group relative flex items-center justify-center gap-2 rounded-md"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Crown className="h-4 w-4 shrink-0" />
          <span className="relative text-sm font-medium truncate">
            {highlight.title}
            {/* Underline effect that sweeps from left to right */}
            <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-current group-hover:w-full transition-all duration-300 ease-out" />
          </span>

          {/* Arrow that appears on hover */}
          <ArrowRight className="h-4 w-4 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out" />
        </button>

      </div>

      <EditTaskDialog
        task={highlight as Task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={() => {}}
        onTaskDeleted={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
}
