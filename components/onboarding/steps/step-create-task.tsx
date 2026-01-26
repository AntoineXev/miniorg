"use client";

import { Keyboard } from "lucide-react";
import { OnboardingStep } from "../onboarding-step";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";

type StepCreateTaskProps = {
  onNext: () => void;
};

export function StepCreateTask({ onNext }: StepCreateTaskProps) {
  return (
    <OnboardingStep
      step={2}
      totalSteps={6}
      title="Everything starts with a task"
      description="Create a task instantly with the + button or the ⌘K shortcut. Set when you want to complete it: in 3 days, next week, or a specific date."
      leftContent={
        <FeatureCard
          icon={Keyboard}
          title="Quick shortcut"
          description="Press ⌘K anywhere in the app to create a task instantly."
        />
      }
      rightContent={
        <PreviewContainer>
          <img
            src="/images/step2-create-task.svg"
            alt="Create task"
            className="h-full w-auto"
          />
        </PreviewContainer>
      }
      ctaLabel="Continue"
      onCtaClick={onNext}
    />
  );
}
