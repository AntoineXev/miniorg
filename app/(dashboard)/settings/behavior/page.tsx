"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { NavButton } from "@/components/ui/nav-button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Clock } from "lucide-react";
import { useUserSettingsQuery } from "@/lib/api/queries/user-settings";
import { useUpdateUserSettingsMutation } from "@/lib/api/mutations/user-settings";

export default function BehaviorSettingsPage() {
  const router = useRouter();
  const { data: settings, isLoading } = useUserSettingsQuery();
  const updateSettings = useUpdateUserSettingsMutation();

  const handleAutoMoveToggle = (checked: boolean) => {
    updateSettings.mutate({ autoMoveEventsOnComplete: checked });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Header
        title="Behavior"
        subtitle="Customize how the app behaves"
        backButton={
          <NavButton onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1} />
          </NavButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Task Completion Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Task Completion
            </h3>
            <Card className="overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 mt-0.5">
                  <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={1} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Auto-move events on completion
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When you complete a task, automatically move its calendar event to end at the current time. This helps track when you actually finished tasks.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch
                    checked={settings?.autoMoveEventsOnComplete ?? true}
                    onCheckedChange={handleAutoMoveToggle}
                    disabled={isLoading || updateSettings.isPending}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
