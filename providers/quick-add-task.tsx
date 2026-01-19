"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type QuickAddTaskContextType = {
  openQuickAdd: (date?: Date) => void;
  closeQuickAdd: () => void;
  isOpen: boolean;
  prefilledDate?: Date;
};

const QuickAddTaskContext = createContext<QuickAddTaskContextType | undefined>(undefined);

export function QuickAddTaskProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();

  const openQuickAdd = useCallback((date?: Date) => {
    setPrefilledDate(date);
    setIsOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsOpen(false);
    setPrefilledDate(undefined);
  }, []);

  return (
    <QuickAddTaskContext.Provider value={{ openQuickAdd, closeQuickAdd, isOpen, prefilledDate }}>
      {children}
    </QuickAddTaskContext.Provider>
  );
}

export function useQuickAddTask() {
  const context = useContext(QuickAddTaskContext);
  if (context === undefined) {
    throw new Error("useQuickAddTask must be used within a QuickAddTaskProvider");
  }
  return context;
}
