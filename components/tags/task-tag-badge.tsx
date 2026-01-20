"use client";

import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskTagBadgeProps = {
  tag: {
    id: string;
    name: string;
    color: string;
  };
  displayName?: string; // Optional custom display name (e.g., "Parent > Child")
  onClick?: () => void;
  size?: "small" | "base";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function TaskTagBadge({
  tag,
  displayName,
  onClick,
  size = "base",
  className,
  iconClassName,
  textClassName,
}: TaskTagBadgeProps) {
  const iconSize = size === "small" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "small" ? "text-xs" : "text-sm";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-1",
        onClick && "cursor-pointer hover:opacity-70 transition-opacity",
        className
      )}
    >
      <Hash
        strokeWidth={2}
        className={cn(iconSize, iconClassName)}
        style={{ color: tag.color }}
      />
      <span className={cn(textSize, "text-muted-foreground", textClassName)}>
        {displayName || tag.name}
      </span>
    </div>
  );
}
