"use client";

import { cn } from "@/lib/utils";

type GoogleCalendarIconProps = {
  className?: string;
  size?: number;
};

export function GoogleCalendarIcon({ className, size = 20 }: GoogleCalendarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn("transition-all duration-200", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shape */}
      <path
        d="M152.637 200H47.363C21.204 200 0 178.796 0 152.637V47.363C0 21.204 21.204 0 47.363 0h105.274C178.796 0 200 21.204 200 47.363v105.274C200 178.796 178.796 200 152.637 200z"
        fill="#4285F4"
      />
      {/* Yellow corner */}
      <path
        d="M200 152.637V47.363C200 21.204 178.796 0 152.637 0H152.637L152.637 47.363 200 47.363z"
        fill="#4285F4"
      />
      <path
        d="M152.637 47.363H200V152.637H152.637z"
        fill="#FBBC04"
      />
      {/* Red triangle */}
      <path
        d="M152.637 152.637H200L152.637 200z"
        fill="#EA4335"
      />
      {/* Green bottom */}
      <path
        d="M0 152.637C0 178.796 21.204 200 47.363 200h105.274V152.637H0z"
        fill="#34A853"
      />
      {/* White center */}
      <rect x="40" y="40" width="112" height="112" fill="white" />
      {/* Blue "31" text */}
      <text
        x="96"
        y="118"
        textAnchor="middle"
        fill="#4285F4"
        fontSize="56"
        fontWeight="400"
        fontFamily="Google Sans, Roboto, Arial, sans-serif"
      >
        31
      </text>
    </svg>
  );
}
