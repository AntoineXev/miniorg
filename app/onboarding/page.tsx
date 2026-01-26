"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding/onboarding";

function OnboardingContent() {
  const searchParams = useSearchParams();

  // If returning from OAuth, go to step 5
  const onboarding = searchParams.get("onboarding");
  const initialStep = onboarding === "true" ? 5 : 1;

  return <Onboarding initialStep={initialStep} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
