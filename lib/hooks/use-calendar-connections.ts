"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiClient } from "@/lib/api/client";

export type CalendarConnection = {
  id: string;
  name: string;
  provider: string;
  calendarId: string;
  isActive: boolean;
  isExportTarget: boolean;
  lastSyncAt: string | null;
  createdAt: string;
};

export function useCalendarConnections() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await ApiClient.get<CalendarConnection[]>("/api/calendar-connections");
      setConnections(data);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    isLoading,
    refetch: fetchConnections,
  };
}
