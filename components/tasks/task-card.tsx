"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Calendar } from "lucide-react";

export type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    scheduledDate?: Date | null;
    deadlineType?: string | null;
    deadlineSetAt?: Date | null;
    completedAt?: Date | null;
    tags?: Array<{ id: string; name: string; color: string }>;
  };
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  showTime?: boolean;
};

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  showTime = false,
}: TaskCardProps) {
  const isCompleted = task.status === "done";

  const getDeadlineDisplay = () => {
    // Case 1: Specific scheduled date
    if (task.scheduledDate) {
      const date = new Date(task.scheduledDate);
      const now = new Date();
      
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
    >
      <Card
        className={cn(
          "group relative p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
          isCompleted && "opacity-60"
        )}
        onClick={() => onEdit?.(task.id)}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) =>
              onToggleComplete?.(task.id, checked as boolean)
            }
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-medium text-sm",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task.id);
                    }}
                    className="p-1 hover:bg-secondary rounded"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {deadlineInfo && (
              <div className="flex items-center gap-1 mt-2">
                <Calendar className={cn(
                  "h-3 w-3",
                  deadlineInfo.overdue ? "text-destructive" : deadlineInfo.urgent ? "text-orange-500" : "text-muted-foreground"
                )} />
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

            {showTime && task.scheduledDate && (
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(task.scheduledDate), "h:mm a")}
              </p>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
