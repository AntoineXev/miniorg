"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectableItem } from "@/components/ui/selectable-item";
import { Calendar, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarConnection = {
  id: string;
  name: string;
  provider: string;
  calendarId: string;
  isActive: boolean;
  isExportTarget: boolean;
};

type OnboardingStep = 1 | 2;

type CalendarOnboardingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: CalendarConnection[];
  onComplete: (activeIds: string[], exportId: string | null) => Promise<void>;
};

export function CalendarOnboardingModal({
  open,
  onOpenChange,
  calendars,
  onComplete,
}: CalendarOnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [exportCalendarId, setExportCalendarId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleCalendar = (calendarId: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
    setError(null);
  };

  const handleSelectExportCalendar = (calendarId: string | null) => {
    setExportCalendarId(calendarId);
    setError(null);
  };

  const handleNext = () => {
    if (selectedCalendarIds.length === 0) {
      setError("Please select at least one calendar to sync");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleComplete = async () => {
    // Validate step 2
    if (exportCalendarId && !selectedCalendarIds.includes(exportCalendarId)) {
      setError("Export calendar must be one of the selected calendars");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete(selectedCalendarIds, exportCalendarId);
      // Reset state
      setStep(1);
      setSelectedCalendarIds([]);
      setExportCalendarId(null);
      onOpenChange(false);
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setError("Failed to save calendar settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCalendars = calendars.filter((cal) =>
    selectedCalendarIds.includes(cal.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Setup
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select which calendars you want to sync with MiniOrg"
              : "Choose a calendar where your tasks will be exported (optional)"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-4">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary"
            )}
          >
            {step === 1 ? "1" : <Check className="h-4 w-4" />}
          </div>
          <div className="h-[2px] flex-1 bg-border" />
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            2
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {calendars.map((calendar) => (
                  <SelectableItem
                    key={calendar.id}
                    selected={selectedCalendarIds.includes(calendar.id)}
                    onToggle={() => handleToggleCalendar(calendar.id)}
                    multiSelect={true}
                  >
                    <div>
                      <h3 className="font-medium">{calendar.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {calendar.provider} • {calendar.calendarId}
                      </p>
                    </div>
                  </SelectableItem>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  When you schedule a task, it will automatically be added to
                  this calendar. You can skip this step if you don&apos;t want
                  automatic exports.
                </p>

                {/* None option */}
                <SelectableItem
                  selected={exportCalendarId === null}
                  onToggle={() => handleSelectExportCalendar(null)}
                  multiSelect={false}
                >
                  <div>
                    <h3 className="font-medium">No automatic export</h3>
                    <p className="text-sm text-muted-foreground">
                      Tasks won&apos;t be exported to any calendar
                    </p>
                  </div>
                </SelectableItem>

                {selectedCalendars.map((calendar) => (
                  <SelectableItem
                    key={calendar.id}
                    selected={exportCalendarId === calendar.id}
                    onToggle={() => handleSelectExportCalendar(calendar.id)}
                    multiSelect={false}
                  >
                    <div>
                      <h3 className="font-medium">{calendar.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {calendar.provider} • {calendar.calendarId}
                      </p>
                    </div>
                  </SelectableItem>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20"
            >
              {error}
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:gap-2">
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={selectedCalendarIds.length === 0}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
