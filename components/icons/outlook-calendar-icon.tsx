"use client";

import { cn } from "@/lib/utils";

type OutlookCalendarIconProps = {
  className?: string;
  size?: number;
};

export function OutlookCalendarIcon({ className, size = 20 }: OutlookCalendarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("transition-all duration-200", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="outlook-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0078D4" />
          <stop offset="100%" stopColor="#0364B8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="4" fill="url(#outlook-grad)" />
      <path
        d="M16 7C11.03 7 7 11.03 7 16C7 20.97 11.03 25 16 25C20.97 25 25 20.97 25 16C25 11.03 20.97 7 16 7ZM16 23C12.13 23 9 19.87 9 16C9 12.13 12.13 9 16 9C19.87 9 23 12.13 23 16C23 19.87 19.87 23 16 23Z"
        fill="white"
      />
      <path
        d="M16 11C16.55 11 17 11.45 17 12V15.59L19.29 17.88C19.68 18.27 19.68 18.9 19.29 19.29C18.9 19.68 18.27 19.68 17.88 19.29L15.29 16.71C15.11 16.52 15 16.27 15 16V12C15 11.45 15.45 11 16 11Z"
        fill="white"
      />
    </svg>
  );
}
