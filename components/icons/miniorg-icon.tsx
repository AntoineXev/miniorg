"use client";

import { cn } from "@/lib/utils";

type MiniorgIconProps = {
  className?: string;
  size?: number;
};

export function MiniorgIcon({ className, size = 20 }: MiniorgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("transition-all duration-200", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="20" fill="#EE6B2F" />
    </svg>
  );
}
