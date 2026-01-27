"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavButton } from "@/components/ui/nav-button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CalendarOnboardingModal } from "@/components/calendar/calendar-onboarding-modal";
import { CalendarManager } from "@/components/calendar/calendar-manager";
import { useCalendarConnections } from "@/lib/hooks/use-calendar-connections";
import { ApiClient } from "@/lib/api/client";

export default function CalendarsSettingsPage() {
  const { connections, isLoading, refetch } = useCalendarConnections();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we should show the onboarding modal
    const onboarding = searchParams.get("onboarding");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Authentication failed", { description: error });
      window.history.replaceState({}, "", "/settings/calendars");
      return;
    }

    if (onboarding === "true") {
      setShowOnboardingModal(true);
      window.history.replaceState({}, "", "/settings/calendars");
    }
  }, [searchParams]);

  const handleOnboardingComplete = async (
    activeIds: string[],
    exportId: string | null
  ) => {
    try {
      for (const connection of connections) {
        const shouldBeActive = activeIds.includes(connection.id);
        if (connection.isActive !== shouldBeActive) {
          await ApiClient.patch("/api/calendar-connections", { id: connection.id, isActive: shouldBeActive });
        }
      }

      if (exportId) {
        await ApiClient.patch("/api/calendar-connections", { id: exportId, isExportTarget: true });
      }

      await refetch();
      toast.success(
        "Calendar setup complete",
        { description: `${activeIds.length} calendar(s) configured` }
      );
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const data = await ApiClient.post<{ syncedCount: number; totalCount: number }>("/api/calendar-sync", {});
      toast.success(
        "Synchronization complete",
        { description: `${data.syncedCount}/${data.totalCount} calendar(s) synced` }
      );
      refetch();
    } catch (error) {
      console.error("Error syncing calendars:", error);
      toast.error("Synchronization failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <Header
          title="Calendriers"
          subtitle="Synchroniser vos calendriers externes"
          backButton={
            <NavButton onClick={() => router.push("/settings")}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1} />
            </NavButton>
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={isSyncing || connections.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Calendar Manager */}
            <CalendarManager />

            {/* Info Section */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">How it works</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Active calendars</strong>: Events from these calendars will be imported into your timeline</li>
                <li>• <strong>Export calendar</strong>: When you schedule a task, it will be automatically exported to this calendar</li>
                <li>• <strong>Sync</strong>: Your calendars sync automatically when you open the timeline</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <CalendarOnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
        calendars={connections}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
