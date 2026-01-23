"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type TimelineDragContextValue = {
  isOverTimeline: boolean;
  setIsOverTimeline: (value: boolean) => void;
};

const TimelineDragContext = createContext<TimelineDragContextValue | null>(null);

export function TimelineDragProvider({ children }: { children: ReactNode }) {
  const [isOverTimeline, setIsOverTimeline] = useState(false);

  return (
    <TimelineDragContext.Provider value={{ isOverTimeline, setIsOverTimeline }}>
      {children}
    </TimelineDragContext.Provider>
  );
}

export function useTimelineDrag() {
  const context = useContext(TimelineDragContext);
  if (!context) {
    throw new Error("useTimelineDrag must be used within a TimelineDragProvider");
  }
  return context;
}
