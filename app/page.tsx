"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const router = useRouter();
  const { isCompleted, isLoading } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    if (isCompleted) {
      router.replace("/calendar");
    } else {
      router.replace("/onboarding");
    }
  }, [isCompleted, isLoading, router]);

  // Show loading state while checking onboarding status
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Loader />
    </div>
  );
}
