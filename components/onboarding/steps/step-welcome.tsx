"use client";

import { Target } from "lucide-react";
import { OnboardingStep } from "../onboarding-step";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";

type StepWelcomeProps = {
  onNext: () => void;
};

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <OnboardingStep
      step={1}
      totalSteps={7}
      title="Welcome to MiniOrg"
      description="Organize your day and find balance between work and personal life. Plan your tasks every morning and focus on what really matters."
      leftContent={
        <FeatureCard
          icon={Target}
          title="A simple method"
          description="Every day: set your priority, plan your tasks, and timebox them on your calendar."
        />
      }
      rightContent={
        <PreviewContainer>
          <img
            src="/images/step1-welcome.svg"
            alt="Calendar preview"
            className="h-full w-auto"
          />
        </PreviewContainer>
      }
      ctaLabel="Get started"
      onCtaClick={onNext}
    />
  );
}
