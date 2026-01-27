"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/api/types";
import { isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type TimeSummaryProps = {
  tasks: Task[];
  date: Date;
};

export function TimeSummary({ tasks, date }: TimeSummaryProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { plannedMinutes, finalizedMinutes } = useMemo(() => {
    // Calculate planned time from tasks scheduled for this date
    const todayTasks = tasks.filter((task) => {
      if (!task.scheduledDate) return false;
      const taskDate = typeof task.scheduledDate === "string"
        ? parseISO(task.scheduledDate)
        : task.scheduledDate;
      return isSameDay(taskDate, date);
    });

    const planned = todayTasks.reduce((sum, task) => sum + (task.duration || 30), 0);

    // Calculate finalized time from completed tasks
    const completedTasks = tasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completedDate = typeof task.completedAt === "string"
        ? parseISO(task.completedAt)
        : task.completedAt;
      return isSameDay(completedDate, date);
    });

    const finalized = completedTasks.reduce((sum, task) => sum + (task.duration || 30), 0);

    return { plannedMinutes: planned, finalizedMinutes: finalized };
  }, [tasks, date]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (minutes === 0) return "0 hr";
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours}h ${mins}m`;
  };

  // Use planned time as the max, or finalized if it exceeds planned
  const maxMinutes = Math.max(plannedMinutes, finalizedMinutes, 60); // At least 1hr for scale

  // Calculate positions as percentages of max
  const finalizedPercent = (finalizedMinutes / maxMinutes) * 100;
  const plannedPercent = (plannedMinutes / maxMinutes) * 100;

  // Calculate completion ratio for color
  const completionRatio = plannedMinutes > 0 ? finalizedMinutes / plannedMinutes : 0;

  // Determine color based on completion
  // < 33% = yellow (not much done)
  // 33-66% = orange (doing okay)
  // > 66% = green (good progress)
  const getColorClasses = () => {
    if (completionRatio >= 0.66) {
      return {
        bar: "bg-green-500",
        badge: "bg-green-500 text-white",
        arrow: "border-t-green-500",
      };
    } else if (completionRatio >= 0.33) {
      return {
        bar: "bg-orange-500",
        badge: "bg-orange-500 text-white",
        arrow: "border-t-orange-500",
      };
    } else {
      return {
        bar: "bg-yellow-500",
        badge: "bg-yellow-500 text-yellow-950",
        arrow: "border-t-yellow-500",
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="overflow-visible">
      {/* Header */}
      <h3 className="text-base font-semibold">Total time</h3>
      <p className="text-xs font-light italic pt-1 text-muted-foreground mb-6">
        How much time did you spend on tasks today?
      </p>

      {/* Progress bar section */}
      <div
        className="relative cursor-pointer py-2 pt-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip badge showing finalized time - appears on hover with bounce animation */}
        <div
          className={cn(
            "absolute bottom-full mb-1 left-1/2 -translate-x-1/2 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isHovered
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-90 pointer-events-none"
          )}
        >
          <div className="relative inline-block">
            <div className={cn(
              "text-sm font-medium px-3 py-1 rounded-md whitespace-nowrap shadow-lg",
              colors.badge
            )}>
              {formatDuration(finalizedMinutes)} over {formatDuration(plannedMinutes)} planned
            </div>
            {/* Arrow pointing down */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent",
              colors.arrow
            )} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-zinc-100 rounded-full">
          {/* Filled portion */}
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out", colors.bar)}
            style={{ width: `${finalizedPercent}%` }}
          />

          {/* Planned time marker */}
          {plannedMinutes > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-muted-foreground/10"
              style={{ left: `${plannedPercent}%` }}
            />
          )}
        </div>

        {/* Labels below the bar */}
        <div className="relative h-5 mt-2">
          {/* Finalized time label */}
          <span
            className="absolute text-xs text-muted-foreground transition-all duration-500 ease-out"
            style={{
              left: `${Math.min(Math.max(finalizedPercent, 5), 90)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatDuration(finalizedMinutes)}
          </span>

          {/* Planned time label */}
          {plannedMinutes > 0 && Math.abs(plannedPercent - finalizedPercent) > 10 && (
            <span
              className="absolute text-xs text-muted-foreground"
              style={{
                left: `${Math.min(plannedPercent, 95)}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {formatDuration(plannedMinutes)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
