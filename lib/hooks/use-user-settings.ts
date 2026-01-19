"use client";

import { useEffect, useState } from "react";
import { userSettingsStore } from "@/lib/stores/user-settings";

export function useUserSettings() {
  const [settings, setSettings] = useState(() =>
    userSettingsStore.getSettings()
  );

  useEffect(() => {
    const unsubscribe = userSettingsStore.subscribe(setSettings);
    return unsubscribe;
  }, []);

  return {
    settings,
    setRightSidebarActivePanel: (panel: string | null) =>
      userSettingsStore.setRightSidebarActivePanel(panel),
    getRightSidebarActivePanel: () =>
      userSettingsStore.getRightSidebarActivePanel(),
  };
}
