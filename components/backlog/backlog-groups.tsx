"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCard } from "@/components/tasks/task-card";
import { DraggableTaskWrapper } from "@/components/backlog/draggable-task-wrapper";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskDeadlineGroup, deadlineTypeLabels, type DeadlineGroup } from "@/lib/utils/task";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  deadlineSetAt?: Date | null;
  duration?: number | null; // Duration in minutes
  completedAt?: Date | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  createdAt: Date;
  updatedAt: Date;
};

type BacklogGroupsProps = {
  tasks: Task[];
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
};

const groupOrder: DeadlineGroup[] = [
  "overdue",
  "next_3_days",
  "next_week",
  "next_month",
  "next_quarter",
  "next_year",
  "no_date",
];

export function BacklogGroups({ tasks, onToggleComplete, onEdit, onDelete }: BacklogGroupsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groupOrder)
  );

  // Group tasks
  const groupedTasks = tasks.reduce((acc, task) => {
    const group = getTaskDeadlineGroup(task as any);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(task);
    return acc;
  }, {} as Record<DeadlineGroup, Task[]>);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  return (
    <div>
      {groupOrder.map((group) => {
        const tasksInGroup = groupedTasks[group] || [];
        if (tasksInGroup.length === 0) return null;

        const isExpanded = expandedGroups.has(group);

        return (
          <div key={group} className="border-boverflow-hidden bg-background">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 pt-3 pb-2 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className={cn(
                  "font-semibold",
                  group === "overdue" && "text-destructive"
                )}>
                  {deadlineTypeLabels[group]}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({tasksInGroup.length})
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 bg-background">
                    {tasksInGroup.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <DraggableTaskWrapper task={task}>
                          <TaskCard
                            task={task}
                            onToggleComplete={onToggleComplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        </DraggableTaskWrapper>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
