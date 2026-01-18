"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

type ToastProps = {
  toast: Toast;
  onClose: () => void;
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.95 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg bg-[#0a0a0a] px-4 py-3 shadow-xl border border-white/5",
        "min-w-[320px] max-w-[420px]"
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full shrink-0 shadow-sm",
          toast.variant === "success" && "bg-[#4ade80] shadow-[#4ade80]/50",
          toast.variant === "error" && "bg-[#f87171] shadow-[#f87171]/50",
          toast.variant === "info" && "bg-[#60a5fa] shadow-[#60a5fa]/50"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-white/70 mt-0.5">{toast.description}</p>
        )}
      </div>

      {/* Separator & Action */}
      {toast.action && (
        <>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={toast.action.onClick}
            className="text-xs font-medium text-white hover:text-white/80 transition-colors shrink-0"
          >
            {toast.action.label}
          </button>
        </>
      )}

      {/* Separator & Close button */}
      <div className="h-4 w-px bg-white/20" />
      <button
        onClick={handleClose}
        className="text-white/60 hover:text-white transition-colors shrink-0"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
