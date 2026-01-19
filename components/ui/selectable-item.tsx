"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectableItemProps = {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  multiSelect?: boolean; // true pour checkbox, false pour radio
  color?: string; // couleur d'accent optionnelle
  className?: string;
};

export function SelectableItem({
  selected,
  onToggle,
  children,
  disabled = false,
  multiSelect = true,
  color,
  className,
}: SelectableItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        "relative w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={
        color && selected
          ? {
              borderLeftWidth: "4px",
              borderLeftColor: color,
            }
          : color
          ? {
              borderLeftWidth: "2px",
              borderLeftColor: "transparent",
            }
          : undefined
      }
    >
      {/* Checkbox/Radio indicator in top right */}
      <div className="absolute top-2 right-2 z-10">
        <motion.div
          initial={false}
          animate={{
            scale: selected ? 1 : 0.8,
            opacity: selected ? 1 : 0.5,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground border-2 border-border"
          )}
        >
          {multiSelect ? (
            selected ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              <div className="w-4 h-4" />
            )
          ) : (
            <Circle
              className={cn(
                "h-3 w-3",
                selected ? "fill-current" : "fill-transparent"
              )}
            />
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="pr-8">{children}</div>
    </motion.button>
  );
}
