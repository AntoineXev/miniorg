"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { startOfDay } from "date-fns";

type TimelineDateContextType = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

const TimelineDateContext = createContext<TimelineDateContextType | undefined>(undefined);

export function TimelineDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  return (
    <TimelineDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </TimelineDateContext.Provider>
  );
}

export function useTimelineDate() {
  const context = useContext(TimelineDateContext);
  if (!context) {
    throw new Error("useTimelineDate must be used within a TimelineDateProvider");
  }
  return context;
}
