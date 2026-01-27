"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddButton } from "@/components/ui/add-button";
import { Calendar, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { useCalendarConnections } from "@/lib/hooks/use-calendar-connections";
import { isTauri } from "@/lib/platform";
import { ApiClient } from "@/lib/api/client";

type CalendarManagerProps = {
  callbackUrl?: string;
};

export function CalendarManager({ callbackUrl = "/settings/calendars" }: CalendarManagerProps) {
  const { connections, isLoading, refetch } = useCalendarConnections();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);

    if (isTauri()) {
      try {
        const response = await ApiClient.get<{ authUrl: string }>(
          `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        if (response.authUrl) {
          const { open } = await import("@tauri-apps/plugin-shell");
          await open(response.authUrl);
          toast.info("Browser opened", {
            description: "Complete the authentication in your browser, then come back here.",
          });
        }
      } catch (error) {
        console.error("Error initiating Google auth:", error);
        toast.error("Failed to connect to Google Calendar");
        setIsConnecting(false);
      }
    } else {
      window.location.href = `/api/auth/google-calendar?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await ApiClient.patch("/api/calendar-connections", { id, isActive });
      refetch();
      toast.success(isActive ? "Calendar enabled" : "Calendar disabled");
    } catch (error) {
      console.error("Error toggling calendar:", error);
      toast.error("Failed to update");
    }
  };

  const handleSetExportTarget = async (id: string) => {
    try {
      await ApiClient.patch("/api/calendar-connections", { id, isExportTarget: true });
      refetch();
      toast.success("Export calendar updated");
    } catch (error) {
      console.error("Error setting export target:", error);
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this connection?")) {
      return;
    }

    try {
      await ApiClient.delete(`/api/calendar-connections?id=${id}`);
      refetch();
      toast.success("Calendar removed");
    } catch (error) {
      console.error("Error deleting calendar:", error);
      toast.error("Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader showText text="Loading calendars" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connect button */}
      <AddButton onClick={handleConnectGoogle}>
        {isConnecting ? "Connecting..." : "Connect Google Calendar"}
      </AddButton>

      {/* Empty state or list */}
      {connections.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No calendars connected
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Connected calendars</p>
          <div className="space-y-2">
            {connections.map((connection) => (
              <Card key={connection.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{connection.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {connection.isActive ? "Active" : "Inactive"}
                        {connection.isExportTarget && " • Export"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Toggle Active */}
                    <Button
                      variant={connection.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleActive(connection.id, !connection.isActive)}
                      className="h-7 text-xs"
                    >
                      {connection.isActive ? "Active" : "Inactive"}
                    </Button>

                    {/* Export Target */}
                    <Button
                      variant={connection.isExportTarget ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetExportTarget(connection.id)}
                      disabled={connection.isExportTarget}
                      title="Set as export calendar"
                      className="h-7 text-xs"
                    >
                      {connection.isExportTarget && <Check className="h-3 w-3 mr-1" />}
                      Export
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(connection.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
