"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startOfDay, addDays, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { HighlightInput } from "@/components/daily-planning/highlight-input";
import { UrgentTasks } from "@/components/daily-planning/urgent-tasks";
import { PlanningDayColumn } from "@/components/daily-planning/planning-day-column";
import { DailyPlanningComplete } from "@/components/daily-planning/daily-planning-complete";
import { useRightSidebar } from "@/components/layout/right-sidebar/context";
import { Button } from "@/components/ui/button";
import { useHighlightQuery, useTasksQuery, useDailyRitualQuery } from "@/lib/api/queries/tasks";
import { useSaveDailyRitualMutation } from "@/lib/api/mutations/tasks";
import { useTimelineDate } from "@/lib/contexts/timeline-date-context";
import { useUserSettingsQuery } from "@/lib/api/queries/user-settings";

type Step = "highlight" | "upcoming" | "review" | "ready";

export default function DailyPlanningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActivePanel } = useRightSidebar();
  const { setSelectedDate: setTimelineDate } = useTimelineDate();
  const [currentStep, setCurrentStep] = useState<Step>("highlight");

  // Get user settings for ritual mode
  const { data: settings } = useUserSettingsQuery();
  const ritualMode = settings?.ritualMode || "separate";

  // Selected date for planning (from query param or defaults to today)
  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      return startOfDay(new Date(dateParam));
    }
    return startOfDay(new Date());
  }, [searchParams]);

  const tomorrowDate = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  // Get highlight, tasks, and existing ritual
  const { data: highlight } = useHighlightQuery(selectedDate);
  const { data: tasks = [] } = useTasksQuery();
  const { data: existingRitual, isLoading: isRitualLoading } = useDailyRitualQuery(selectedDate);
  const saveDailyRitual = useSaveDailyRitualMutation(selectedDate);

  // Get today's planned tasks IDs for the timeline
  const todayTaskIds = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.status === "done") return false;
        if (!task.scheduledDate) return false;
        const taskDate = new Date(task.scheduledDate);
        return taskDate.toDateString() === selectedDate.toDateString();
      })
      .map((task) => task.id);
  }, [tasks, selectedDate]);

  // Auto-open timeline panel and sync date when entering Daily Planning (only on mount)
  useEffect(() => {
    setActivePanel("timeline");
    setTimelineDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If daily ritual already exists, handle based on mode
  useEffect(() => {
    if (!isRitualLoading && existingRitual && currentStep === "highlight") {
      // For evening mode, redirect to wrapup completed screen (end of evening ritual)
      if (ritualMode === "evening") {
        router.replace("/daily-wrapup");
        return;
      }
      // Morning mode and separate mode: show ready step
      setCurrentStep("ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRitualLoading, existingRitual, ritualMode]);

  const handleNextFromHighlight = useCallback(() => {
    setCurrentStep("upcoming");
  }, []);

  const handleNextFromUpcoming = useCallback(() => {
    setCurrentStep("review");
  }, []);

  const handleBackToHighlight = useCallback(() => {
    setCurrentStep("highlight");
  }, []);

  const handleBackToUpcoming = useCallback(() => {
    setCurrentStep("upcoming");
  }, []);

  const handleStartDay = useCallback(async () => {
    // Save the daily ritual
    await saveDailyRitual.mutateAsync({
      highlightId: highlight?.id || null,
      timeline: todayTaskIds,
    });

    // For evening mode, redirect to wrapup completed screen
    if (ritualMode === "evening") {
      router.replace("/daily-wrapup");
      return;
    }

    // For morning mode, show ready step (end of morning ritual)
    // For separate mode, also show ready step
    setCurrentStep("ready");
  }, [saveDailyRitual, highlight?.id, todayTaskIds, ritualMode, router]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const getDirection = (step: Step) => {
    const order = { highlight: 0, upcoming: 1, review: 2, ready: 3 };
    return order[step];
  };

  // For review step, we show a different layout (full width with 2 columns)
  if (currentStep === "review") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Daily Planning" />

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left column: Today's tasks + navigation */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-auto">
                <PlanningDayColumn
                  date={selectedDate}
                  title="Today's Tasks"
                  subtitle="Too much on your plate? Drag tasks to tomorrow to lighten your load."
                />
              </div>

              {/* Bottom navigation */}
              <div className="pt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToUpcoming}
                  className="text-muted-foreground bg-card"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleStartDay}
                  disabled={saveDailyRitual.isPending}
                  className="flex-1 bg-card"
                  variant="outline"
                >
                  {saveDailyRitual.isPending ? "Saving..." : "Start my day"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Right column: Tomorrow's tasks */}
            <div className="flex flex-col h-full overflow-hidden">
              <PlanningDayColumn
                date={tomorrowDate}
                title="Tomorrow"
                subtitle="Drop tasks here to schedule them for tomorrow."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready step - success on left, planned tasks on right
  if (currentStep === "ready") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Daily Planning" />

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left column: Success message */}
            <div className="flex items-center justify-center">
              <DailyPlanningComplete
                highlight={highlight}
                onEdit={() => setCurrentStep("highlight")}
              />
            </div>

            {/* Right column: Today's planned tasks */}
            <PlanningDayColumn
              date={selectedDate}
              title="Today's Tasks"
              subtitle="Your planned tasks for today."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Daily Planning" />

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Left column: Step-based content */}
          <div className="flex flex-col relative h-full overflow-auto">
            <AnimatePresence mode="wait" custom={getDirection(currentStep)}>
              {currentStep === "highlight" && (
                <motion.div
                  key="highlight"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  <HighlightInput date={selectedDate} onNext={handleNextFromHighlight} />
                </motion.div>
              )}

              {currentStep === "upcoming" && (
                <motion.div
                  key="upcoming"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full overflow-auto"
                >
                  <div className="overflow-auto">
                    <UrgentTasks referenceDate={selectedDate} />
                  </div>

                  {/* Bottom navigation */}
                  <div className="mb-auto pt-4 flex-1 flex items-start gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToHighlight}
                      className="text-muted-foreground bg-card"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                    <Button
                      onClick={handleNextFromUpcoming}
                      className="flex-1 bg-card"
                      variant="outline"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right column: Day's Tasks */}
          <PlanningDayColumn
            date={selectedDate}
            title="Planned Tasks"
            subtitle="Tasks scheduled for today. Drag them to the timeline to place them on your calendar."
          />
        </div>
      </div>
    </div>
  );
}
