"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isSameDay, addDays, addMonths, addYears, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar, Crown } from "lucide-react";
import { TagSelector } from "@/components/tags/tag-selector";
import type { Tag } from "@/lib/api/types";

export type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    type?: string | null; // "normal" | "highlight"
    scheduledDate?: Date | null;
    deadlineType?: string | null;
    deadlineSetAt?: Date | null;
    duration?: number | null; // Duration in minutes
    completedAt?: Date | null;
    tag?: { id: string; name: string; color: string } | null;
    calendarEvents?: Array<{ id: string; startTime: Date | string; endTime: Date | string }>;
  };
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdateTag?: (taskId: string, tagId: string | null) => void;
  showTime?: boolean;
  estimatedMinutes?: number;
};

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateTag,
  showTime = false,
  estimatedMinutes,
}: TaskCardProps) {
  const isCompleted = task.status === "done";
  
  // Use task.duration if available, otherwise use estimatedMinutes, default to 30
  const durationMinutes = task.duration ?? estimatedMinutes ?? 30;

  // Formater la durée
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h${mins}`;
  };

  const getDeadlineDisplay = () => {
    // Case 1: Specific scheduled date
    if (task.scheduledDate) {
      const date = new Date(task.scheduledDate);
      const now = new Date();
      
      // Check if there's a calendar event for today
      if (isToday(date) && task.calendarEvents && task.calendarEvents.length > 0) {
        // Find event(s) that are on the same day as the scheduled date
        const todayEvent = task.calendarEvents.find((event) => {
          const eventStart = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
          return isSameDay(eventStart, date);
        });
        
        if (todayEvent) {
          const eventStart = typeof todayEvent.startTime === 'string' ? new Date(todayEvent.startTime) : todayEvent.startTime;
          
          // Calculate expected end time (start time + task duration)
          const taskDuration = task.duration || 30; // Use task duration or default to 30 minutes
          const expectedEndTime = addMinutes(eventStart, taskDuration);
          
          // Check if the expected end time has passed
          const isEventOverdue = isPast(expectedEndTime) && !isCompleted;
          
          return { 
            text: format(eventStart, "HH'h'mm"), 
            urgent: true,
            overdue: isEventOverdue
          };
        }
      }
      
      if (isToday(date)) {
        return { text: "Today", urgent: true };
      }
      if (isTomorrow(date)) {
        return { text: "Tomorrow", urgent: true };
      }
      if (isPast(date) && !isCompleted) {
        return { text: `Overdue (${format(date, "MMM d")})`, urgent: true, overdue: true };
      }
      
      return { 
        text: format(date, "MMM d, yyyy"), 
        urgent: false 
      };
    }
    
    // Case 2: DeadlineType without specific date
    if (task.deadlineType && task.deadlineType !== "no_date" && task.deadlineSetAt) {
      const setDate = new Date(task.deadlineSetAt);
      let targetDate: Date;
      
      switch (task.deadlineType) {
        case 'next_3_days':
          targetDate = addDays(setDate, 3);
          break;
        case 'next_week':
          targetDate = addDays(setDate, 7);
          break;
        case 'next_month':
          targetDate = addMonths(setDate, 1);
          break;
        case 'next_quarter':
          targetDate = addMonths(setDate, 3);
          break;
        case 'next_year':
          targetDate = addYears(setDate, 1);
          break;
        default:
          return null;
      }
      
      const now = new Date();
      const isOverdue = isPast(targetDate) && !isCompleted;
      const isUrgent = isToday(targetDate) || isTomorrow(targetDate);
      
      return {
        text: `before ${format(targetDate, "MMM d, yyyy")}`,
        urgent: isUrgent,
        overdue: isOverdue
      };
    }
    
    return null;
  };

  const deadlineInfo = getDeadlineDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="w-full"
    >
      <Card
        className={cn(
          "group relative p-3 transition-all duration-200 hover:shadow-md cursor-pointer w-full"
        )}
        onClick={() => onEdit?.(task.id)}
      >
        <div className="flex items-start gap-3">
          <div onClick={(e) => e.stopPropagation()} className="isolate">
            <AnimatedCheckbox
              checked={isCompleted}
              onChange={(checked) => onToggleComplete?.(task.id, checked)}
              className="w-5 h-5"
            />
          </div>

          <div className={cn(
            "flex-1 min-w-0 transition-opacity",
            isCompleted && "opacity-70"
          )}>
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "text-sm flex-1 truncate",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>

              {/* Badge durée */}
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-5 bg-muted/10 text-muted-foreground font-medium shrink-0"
              >
                {formatDuration(durationMinutes)}
              </Badge>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
                {task.description}
              </p>
            )}
          <div className="flex justify-between items-center gap-1 mt-3">

            {deadlineInfo && task.type !== "highlight" && (
              <div className="flex items-center gap-1">
                <Calendar className={cn(
                  "h-3 w-3",
                  deadlineInfo.overdue ? "text-destructive" : deadlineInfo.urgent ? "text-orange-500" : "text-muted-foreground"
                )} strokeWidth={1} />
                <span className={cn(
                  "text-xs",
                  deadlineInfo.overdue ? "text-destructive font-medium" : 
                  deadlineInfo.urgent ? "text-orange-500 font-medium" : 
                  "text-muted-foreground"
                )}>
                  {deadlineInfo.text}
                </span>
              </div>
            )}
            {task.type === "highlight" && (
              <div className="flex items-center gap-1">
                <Crown className={cn(
                  "h-3 w-3",
                  "text-orange-500"
                )} strokeWidth={2} />
              </div>
            )}
            {showTime && task.scheduledDate && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(task.scheduledDate), "h:mm a")}
              </p>
            )}

            <div onClick={(e) => e.stopPropagation()} className="isolate">
              <TagSelector
                className={cn(task.tag && 'opacity-100', !task.tag && 'opacity-0 group-hover:opacity-80 transition-opacity')}
                selectedTag={task.tag as Tag | null}
                onSelectTag={(tag) => onUpdateTag?.(task.id, tag?.id || null)}
                showNoTagOption={true}
                size="small"
              />
            </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
