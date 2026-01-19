"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, onPressedChange, size = "default", variant = "default", children, ...props }, ref) => {
    const handleClick = () => {
      onPressedChange?.(!pressed);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={pressed}
        data-state={pressed ? "on" : "off"}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            // Sizes - made thinner
            "h-9 px-2.5 text-sm": size === "default",
            "h-8 px-2 text-xs": size === "sm",
            "h-10 px-3 text-base": size === "lg",
            // Variants - button stays the same, only icon changes via className prop
            "bg-transparent hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground": variant === "default",
            "border border-input bg-card hover:bg-accent hover:text-accent-foreground": variant === "outline",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
