"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectCardProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  status?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
};

export function SelectCard({
  icon,
  title,
  description,
  status,
  selected = false,
  onSelect,
  disabled = false,
  className,
}: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
        {status && <div className="mt-2">{status}</div>}
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 bg-transparent"
        )}
      >
        {selected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
}
