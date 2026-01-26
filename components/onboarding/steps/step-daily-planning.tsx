"use client";

import { Sparkles } from "lucide-react";
import { OnboardingStep } from "../onboarding-step";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";

type StepDailyPlanningProps = {
  onNext: () => void;
};

export function StepDailyPlanning({ onNext }: StepDailyPlanningProps) {
  return (
    <OnboardingStep
      step={4}
      totalSteps={6}
      title="Plan your day"
      description="Every morning, the Daily Planner guides you in 3 steps: choose your goal for the day (Highlight), select your tasks, and place them on your timeline."
      leftContent={
        <FeatureCard
          icon={Sparkles}
          title="Daily Highlight"
          description="Define THE important task of your day. It will be displayed at the top to stay visible."
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
      ctaLabel="Continue"
      onCtaClick={onNext}
    />
  );
}
