"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { NavButton } from "@/components/ui/nav-button";
import { ArrowLeft } from "lucide-react";
import { useUserSettingsQuery } from "@/lib/api/queries/user-settings";
import { useUpdateUserSettingsMutation } from "@/lib/api/mutations/user-settings";
import { RitualModeSelector } from "@/components/settings/ritual-mode-selector";

export default function DailyRitualsSettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading } = useUserSettingsQuery();
  const updateSettings = useUpdateUserSettingsMutation();

  return (
    <div className="flex flex-col h-full bg-background">
      <Header
        title="Daily Rituals"
        subtitle="Choose when to do your planning and wrap-up"
        backButton={
          <NavButton onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1} />
          </NavButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <RitualModeSelector
            value={settings?.ritualMode}
            onChange={(mode) => updateSettings.mutate({ ritualMode: mode })}
            disabled={isLoading || updateSettings.isPending}
          />
        </div>
      </div>
    </div>
  );
}
