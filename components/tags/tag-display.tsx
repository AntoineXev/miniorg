"use client";

import { Hash } from "lucide-react";
import type { Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TagDisplayProps = {
  tag: Tag | null;
  size?: "small" | "base";
  className?: string;
  showDot?: boolean;
  placeholder?: string;
};

export function TagDisplay({ 
  tag, 
  size = "base", 
  className,
  showDot = false,
  placeholder = "No tag"
}: TagDisplayProps) {
  const iconSize = size === "small" ? "h-3 w-3" : "h-3.5 w-3.5";
  const dotSize = size === "small" ? "w-2 h-2" : "w-3 h-3";
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showDot && (
        <div
          className={cn("rounded-full flex-shrink-0", dotSize)}
          style={{ backgroundColor: tag?.color || 'currentColor' }}
        />
      )}
      <Hash 
        className={cn(iconSize)} 
        strokeWidth={2}
        style={{ color: tag?.color || 'currentColor' }}
      />
      <span>
        {tag?.name || placeholder}
      </span>
    </div>
  );
}
