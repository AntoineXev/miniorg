"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

// Types for reschedule confirmation
type RescheduleConfirmOptions = {
  taskTitle: string;
  events: Array<{ id: string; startTime: Date | string; endTime: Date | string }>;
};

type RescheduleConfirmResult = {
  confirmed: boolean;
  deleteEvents: boolean;
};

type AlertContextType = {
  confirmRescheduleEvents: (options: RescheduleConfirmOptions) => Promise<RescheduleConfirmResult>;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Store for accessing the alert functions outside of React components
let alertFunctions: AlertContextType | null = null;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<RescheduleConfirmOptions | null>(null);
  const resolveRef = useRef<((result: RescheduleConfirmResult) => void) | null>(null);

  const confirmRescheduleEvents = useCallback(
    (opts: RescheduleConfirmOptions): Promise<RescheduleConfirmResult> => {
      return new Promise((resolve) => {
        setOptions(opts);
        setIsOpen(true);
        resolveRef.current = resolve;
      });
    },
    []
  );

  const handleDeleteEvents = useCallback(() => {
    resolveRef.current?.({ confirmed: true, deleteEvents: true });
    setIsOpen(false);
    setOptions(null);
  }, []);

  const handleKeepEvents = useCallback(() => {
    resolveRef.current?.({ confirmed: true, deleteEvents: false });
    setIsOpen(false);
    setOptions(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.({ confirmed: false, deleteEvents: false });
    setIsOpen(false);
    setOptions(null);
  }, []);

  const formatTime = (time: Date | string) => {
    const date = typeof time === "string" ? new Date(time) : time;
    return format(date, "HH:mm");
  };

  // Store functions for external access
  alertFunctions = { confirmRescheduleEvents };

  return (
    <AlertContext.Provider value={{ confirmRescheduleEvents }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Events planifies aujourd'hui
            </DialogTitle>
            <DialogDescription>
              La tache{" "}
              <span className="font-medium text-foreground">
                "{options?.taskTitle}"
              </span>{" "}
              a des events planifies aujourd'hui. Voulez-vous les supprimer ou les
              garder ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <div className="space-y-2">
              {options?.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleKeepEvents} className="flex-1">
              Garder les events
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvents}
              className="flex-1"
            >
              Supprimer les events
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}

// Function to access alert from outside React components (must be called after provider is mounted)
export function getAlertFunctions() {
  return alertFunctions;
}
