"use client";

import { useState } from "react";
import { OnboardingStep } from "../onboarding-step";
import { PreviewContainer } from "../ui/preview-container";
import { RitualModeSelector } from "@/components/settings/ritual-mode-selector";
import { useUpdateUserSettingsMutation } from "@/lib/api/mutations/user-settings";
import type { RitualMode } from "@/lib/api/types";

type StepDailyPlanningProps = {
  onNext: () => void;
};

export function StepDailyPlanning({ onNext }: StepDailyPlanningProps) {
  const [selectedMode, setSelectedMode] = useState<RitualMode>("separate");
  const updateSettings = useUpdateUserSettingsMutation();

  const handleNext = () => {
    // Save the selected ritual mode
    updateSettings.mutate({ ritualMode: selectedMode }, {
      onSuccess: () => {
        onNext();
      },
    });
  };

  return (
    <OnboardingStep
      step={4}
      totalSteps={7}
      title="Plan your day"
      description="Every day, the Daily Ritual guides you through planning and reflection. Choose when you prefer to do it:"
      leftContent={
        <RitualModeSelector
          value={selectedMode}
          onChange={setSelectedMode}
          disabled={updateSettings.isPending}
        />
      }
      rightContent={
        <PreviewContainer>
          <img
            src="/images/step4-daily-planning.svg"
            alt="Daily Planning"
            className="h-full w-auto"
          />
        </PreviewContainer>
      }
      ctaLabel={updateSettings.isPending ? "Saving..." : "Continue"}
      onCtaClick={handleNext}
    />
  );
}
