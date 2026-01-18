"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { ToastComponent, type Toast, type ToastVariant } from "./toast";

type ToastContextType = {
  pushToast: (toast: Omit<Toast, "id">) => void;
  pushSuccess: (title: string, description?: string, action?: Toast["action"]) => void;
  pushError: (title: string, description?: string, action?: Toast["action"]) => void;
  pushInfo: (title: string, description?: string, action?: Toast["action"]) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const pushToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const pushSuccess = React.useCallback(
    (title: string, description?: string, action?: Toast["action"]) => {
      pushToast({ variant: "success", title, description, action });
    },
    [pushToast]
  );

  const pushError = React.useCallback(
    (title: string, description?: string, action?: Toast["action"]) => {
      pushToast({ variant: "error", title, description, action });
    },
    [pushToast]
  );

  const pushInfo = React.useCallback(
    (title: string, description?: string, action?: Toast["action"]) => {
      pushToast({ variant: "info", title, description, action });
    },
    [pushToast]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      pushToast,
      pushSuccess,
      pushError,
      pushInfo,
    }),
    [pushToast, pushSuccess, pushError, pushInfo]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div className="flex flex-col gap-2 items-center pointer-events-auto">
              <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                  <ToastComponent
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
