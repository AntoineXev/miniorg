"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavButton } from "@/components/ui/nav-button";
import { Calendar, Plus, Trash2, RefreshCw, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/providers/toast";
import { CalendarOnboardingModal } from "@/components/calendar/calendar-onboarding-modal";

type CalendarConnection = {
  id: string;
  name: string;
  provider: string;
  calendarId: string;
  isActive: boolean;
  isExportTarget: boolean;
  lastSyncAt: string | null;
  createdAt: string;
};

export default function CalendarsSettingsPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const { pushSuccess, pushError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/calendar-connections");
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();

    // Check if we should show the onboarding modal
    const onboarding = searchParams.get("onboarding");
    const error = searchParams.get("error");

    if (error) {
      pushError("Authentication failed", error);
      // Clean up URL
      window.history.replaceState({}, "", "/settings/calendars");
      return;
    }

    if (onboarding === "true") {
      // Wait for connections to load before showing modal
      setShowOnboardingModal(true);
      // Clean up URL
      window.history.replaceState({}, "", "/settings/calendars");
    }
  }, [searchParams, pushError]);

  const handleOnboardingComplete = async (
    activeIds: string[],
    exportId: string | null
  ) => {
    try {
      // Update isActive for selected calendars
      for (const connection of connections) {
        const shouldBeActive = activeIds.includes(connection.id);
        if (connection.isActive !== shouldBeActive) {
          await fetch("/api/calendar-connections", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: connection.id, isActive: shouldBeActive }),
          });
        }
      }

      // Set export target if selected
      if (exportId) {
        await fetch("/api/calendar-connections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: exportId, isExportTarget: true }),
        });
      }

      // Refresh connections
      await fetchConnections();
      pushSuccess(
        "Calendar setup complete",
        `${activeIds.length} calendar(s) configured`
      );
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google-calendar";
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/calendar-connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (response.ok) {
        fetchConnections();
        pushSuccess(
          isActive ? "Calendar enabled" : "Calendar disabled",
          ""
        );
      }
    } catch (error) {
      console.error("Error toggling calendar:", error);
      pushError("Failed to update calendar", "");
    }
  };

  const handleSetExportTarget = async (id: string) => {
    try {
      const response = await fetch("/api/calendar-connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isExportTarget: true }),
      });

      if (response.ok) {
        fetchConnections();
        pushSuccess("Export calendar updated", "");
      }
    } catch (error) {
      console.error("Error setting export target:", error);
      pushError("Failed to update export calendar", "");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this calendar connection?")) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar-connections?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchConnections();
        pushSuccess("Calendar removed", "");
      }
    } catch (error) {
      console.error("Error deleting calendar:", error);
      pushError("Failed to remove calendar", "");
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        pushSuccess(
          "Synchronization complete",
          `${data.syncedCount}/${data.totalCount} calendar(s) synced`
        );
        fetchConnections();
      }
    } catch (error) {
      console.error("Error syncing calendars:", error);
      pushError("Synchronization failed", "");
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
            <Button onClick={handleConnectGoogle} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Connected Calendars */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Connected Calendars</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceSync}
                  disabled={isSyncing || connections.length === 0}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : connections.length === 0 ? (
                <Card className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No calendars connected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Google Calendar to sync events automatically
                  </p>
                  <Button onClick={handleConnectGoogle}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <Card key={connection.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <h3 className="font-medium">{connection.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {connection.provider} • {connection.isActive ? "Active" : "Inactive"}
                              {connection.lastSyncAt && (
                                <> • Last synced {new Date(connection.lastSyncAt).toLocaleString()}</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Active */}
                          <Button
                            variant={connection.isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleActive(connection.id, !connection.isActive)}
                          >
                            {connection.isActive ? "Enabled" : "Disabled"}
                          </Button>

                          {/* Export Target */}
                          <Button
                            variant={connection.isExportTarget ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSetExportTarget(connection.id)}
                            disabled={connection.isExportTarget}
                            title="Set as export target"
                          >
                            {connection.isExportTarget && <Check className="h-4 w-4 mr-1" />}
                            Export
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(connection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

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
