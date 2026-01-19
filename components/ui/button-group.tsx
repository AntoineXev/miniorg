"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  active?: boolean;
}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex shadow-xs items-center rounded-full p-1 gap-1 border border-border/40 bg-card backdrop-blur-sm",
          "dark:bg-zinc-900/50 dark:border-zinc-800/50",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

const ButtonGroupItem = forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, variant = "default", active = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center transition-all duration-200 rounded-full",
          "font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
          "disabled:pointer-events-none disabled:opacity-50",
          "h-8 min-w-8 text-xs",
          
          // Séparateur vertical court (ne prend pas toute la hauteur)
          "after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:translate-x-[200%]",
          "after:h-4 after:w-px after:bg-border/40 dark:after:bg-zinc-700/50",
          "last:after:hidden",
          
          // Coins arrondis pour le premier et dernier bouton en hover
          "",
          
          // Default variant - hover très subtil
          variant === "default" && [
            "hover:bg-muted/10 dark:hover:bg-zinc-800/50",
            "text-foreground/60 hover:text-foreground/80",
          ],
          
          // Primary variant (for "Today" button) - hover très subtil
          variant === "primary" && [
            "hover:bg-muted/10 dark:hover:bg-zinc-800/50",
            "text-foreground/70 hover:text-foreground/90",
            "font-semibold px-4",
          ],
          
          // Active state - plus prononcé
          active && [
            "bg-zinc-200/50 dark:bg-zinc-800/80",
            "text-foreground",
            "shadow-sm shadow-primary/5",
          ],
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ButtonGroupItem.displayName = "ButtonGroupItem";

export { ButtonGroup, ButtonGroupItem };
