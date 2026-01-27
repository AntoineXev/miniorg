"use client";

import { ClipboardList } from "lucide-react";
import { OnboardingStep } from "../onboarding-step";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";

type StepBacklogProps = {
  onNext: () => void;
};

export function StepBacklog({ onNext }: StepBacklogProps) {
  return (
    <OnboardingStep
      step={3}
      totalSteps={6}
      title="Your Backlog"
      description="Find all your planned and overdue tasks in one place. They are automatically organized by due date: next few days, week, month..."
      leftContent={
        <FeatureCard
          icon={ClipboardList}
          title="Never forget anything"
          description="Overdue tasks automatically surface so you can reschedule them."
        />
      }
      rightContent={
        <PreviewContainer>
          <img
            src="/images/step3-backlog.svg"
            alt="Backlog view"
            className="h-full w-auto"
          />
        </PreviewContainer>
      }
      ctaLabel="Continue"
      onCtaClick={onNext}
    />
  );
}
