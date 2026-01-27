"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { StepWelcome } from "./steps/step-welcome";
import { StepCreateTask } from "./steps/step-create-task";
import { StepBacklog } from "./steps/step-backlog";
import { StepDailyPlanning } from "./steps/step-daily-planning";
import { StepCalendar } from "./steps/step-calendar";
import { StepContexts } from "./steps/step-contexts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type OnboardingProps = {
  initialStep?: number;
};

export function Onboarding({ initialStep = 1 }: OnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    router.push("/calendar");
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSkipToEnd = () => {
    handleComplete();
  };

  const handleClose = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    router.push("/calendar");
  };

  return (
    <div className="h-full w-full relative">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-10 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Fermer l'onboarding"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <StepWelcome key="step-1" onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <StepCreateTask key="step-2" onNext={handleNext} />
        )}
        {currentStep === 3 && (
          <StepBacklog key="step-3" onNext={handleNext} />
        )}
        {currentStep === 4 && (
          <StepDailyPlanning key="step-4" onNext={handleNext} />
        )}
        {currentStep === 5 && (
          <StepCalendar key="step-5" onNext={handleNext} onSkip={handleSkip} />
        )}
        {currentStep === 6 && (
          <StepContexts
            key="step-6"
            onComplete={handleComplete}
            onSkip={handleSkipToEnd}
          />
        )}
      </AnimatePresence>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave the tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? You can resume the tutorial later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
