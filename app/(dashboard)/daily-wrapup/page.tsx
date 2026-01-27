"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { startOfDay, format, isSameDay, parseISO, isPast } from "date-fns";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Moon } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useRightSidebar } from "@/components/layout/right-sidebar/context";
import { useTasksQuery, useDailyRitualQuery, useHighlightQuery } from "@/lib/api/queries/tasks";
import { useTagsQuery } from "@/lib/api/queries/tags";
import { useCalendarEventsQuery } from "@/lib/api/queries/calendar-events";
import { useSaveWrapupMutation, useRolloverTasksMutation } from "@/lib/api/mutations/tasks";
import {
  TimeSummary,
  WrapupCompletedColumn,
  WrapupIncompleteColumn,
  WrapupNotes,
  DayTimeline,
  HighlightCard,
} from "@/components/daily-wrapup";

// Dynamic import to exclude recharts from server bundle
const TimeDistributionChart = dynamic(
  () => import("@/components/daily-wrapup/time-distribution-chart").then((mod) => mod.TimeDistributionChart),
  { ssr: false }
);

type Step = "review" | "summary" | "completed";

export default function DailyWrapupPage() {
  const { setActivePanel } = useRightSidebar();
  const [currentStep, setCurrentStep] = useState<Step>("review");
  const [notes, setNotes] = useState<string>("");

  // Selected date for wrap-up (defaults to today)
  const selectedDate = useMemo(() => startOfDay(new Date()), []);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Queries
  const { data: tasks = [] } = useTasksQuery();
  const { data: tags = [] } = useTagsQuery();
  const { data: events = [] } = useCalendarEventsQuery({
    startDate: dateStr,
    endDate: dateStr,
  });
  const { data: existingRitual, isLoading: isRitualLoading } = useDailyRitualQuery(selectedDate);
  const { data: highlight } = useHighlightQuery(selectedDate);

  // Mutations
  const saveWrapup = useSaveWrapupMutation(selectedDate);
  const rolloverTasks = useRolloverTasksMutation();

  // Get incomplete tasks for rollover
  const incompleteTaskIds = useMemo(() => {
    const dateStart = startOfDay(selectedDate);
    return tasks
      .filter((task) => {
        if (task.status === "done") return false;
        if (!task.scheduledDate) return false;
        const taskDate =
          typeof task.scheduledDate === "string"
            ? parseISO(task.scheduledDate)
            : task.scheduledDate;
        // Today or overdue
        return isSameDay(taskDate, selectedDate) || (isPast(taskDate) && taskDate < dateStart);
      })
      .map((task) => task.id);
  }, [tasks, selectedDate]);

  // Hide right sidebar on mount
  useEffect(() => {
    setActivePanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-skip to completed if wrapupCompletedAt exists
  useEffect(() => {
    if (!isRitualLoading && existingRitual?.wrapupCompletedAt && currentStep === "review") {
      setNotes(existingRitual.notes || "");
      setCurrentStep("completed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRitualLoading, existingRitual]);

  // Load existing notes
  useEffect(() => {
    if (existingRitual?.notes) {
      setNotes(existingRitual.notes);
    }
  }, [existingRitual?.notes]);

  const handleCompleteWrapup = useCallback(async () => {
    await saveWrapup.mutateAsync({
      notes: notes || null,
      wrapupCompletedAt: new Date().toISOString(),
    });
    setCurrentStep("completed");
  }, [saveWrapup, notes]);

  const handleGoToReview = useCallback(() => {
    setCurrentStep("review");
  }, []);

  const handleGoToSummary = useCallback(async () => {
    // Rollover incomplete tasks to tomorrow before going to summary
    if (incompleteTaskIds.length > 0) {
      await rolloverTasks.mutateAsync({ taskIds: incompleteTaskIds });
    }
    setCurrentStep("summary");
  }, [incompleteTaskIds, rolloverTasks]);

  const handleGoToCompleted = useCallback(async () => {
    // Save notes if they've been modified
    if (notes !== (existingRitual?.notes || "")) {
      await saveWrapup.mutateAsync({
        notes: notes || null,
      });
    }
    setCurrentStep("completed");
  }, [notes, existingRitual?.notes, saveWrapup]);

  const isWrapupCompleted = !!existingRitual?.wrapupCompletedAt;

  // Step 3: Completion - Animated success message
  if (currentStep === "completed") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Daily Wrap Up" />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            {/* Animated moon icon */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <div className="w-24 h-24 flex items-center justify-center">
                <Moon className="w-12 h-12 text-primary" strokeWidth={1} />
              </div>
            </motion.div>

            {/* Animated text */}
            <motion.h1
              className="text-3xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Your day is done
            </motion.h1>

            <motion.p
              className="text-md font-light text-muted-foreground mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              You can rest with ease
            </motion.p>

            {/* Review button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={handleGoToReview}
                className="bg-card"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Review wrap-up
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Summary - Highlight, Notes, Timeline
  if (currentStep === "summary") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Daily Wrap Up" />

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-10 h-full">
            {/* Left column: Highlight + Notes */}
            <div className="flex pt-2 flex-col gap-8 h-full">
              {/* Highlight of the day */}
              <HighlightCard highlight={highlight} />

              {/* Notes */}
              <div className="flex-1">
                <WrapupNotes
                  initialNotes={notes}
                  onChange={setNotes}
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGoToReview}
                  className="bg-card"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
                {!isWrapupCompleted ? (
                  <Button
                    variant="outline"
                    className="flex-1 bg-card"
                    onClick={handleCompleteWrapup}
                    disabled={saveWrapup.isPending}
                  >
                    {saveWrapup.isPending ? "Saving..." : "Complete wrap-up"}
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 bg-card"
                    onClick={handleGoToCompleted}
                    disabled={saveWrapup.isPending}
                  >
                    {saveWrapup.isPending ? "Saving..." : "Done"}
                  </Button>
                )}
              </div>
            </div>

            {/* Right column: Timeline */}
            <DayTimeline
              tasks={tasks}
              events={events}
              date={selectedDate}
            />
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Review - 3 columns
  return (
    <div className="flex flex-col h-full">
      <Header title="Daily Wrap Up" />

      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 h-full overflow-hidden ">
          {/* Column 1: Time Summary + Distribution */}
          <div className="flex flex-col pt-4 gap-4 h-full flex-1 overflow-x-hidden pr-1  overflow-y-auto ">
            <TimeSummary
              tasks={tasks}
              date={selectedDate}
            />
            <TimeDistributionChart
              tasks={tasks}
              tags={tags}
              date={selectedDate}
            />


            {/* Navigation to step 2 */}
            <div className="sticky bg-background/90 bottom-0 mt-auto pt-2 sticky-bottom-shadow backdrop-blur-sm">
              <Button
                variant="outline"
                onClick={handleGoToSummary}
                disabled={rolloverTasks.isPending}
                className="w-full bg-card"
              >
                {rolloverTasks.isPending ? "Rolling over tasks..." : "Continue to summary"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              {incompleteTaskIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {incompleteTaskIds.length} task{incompleteTaskIds.length !== 1 ? "s" : ""} will be rolled over to tomorrow
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Completed Tasks */}
            <WrapupCompletedColumn date={selectedDate} />

          {/* Column 3: Incomplete Tasks */}
            <WrapupIncompleteColumn date={selectedDate} />
        </div>
      </div>
    </div>
  );
}
