import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "today";
  size?: "default" | "sm";
}

const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - rounded with thin border
          "inline-flex items-center justify-center rounded-full border transition-all duration-200",
          "font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          
          // Variants
          variant === "default" && [
            "border-border/60 hover:border-border",
            "bg-background hover:bg-muted/50",
            "text-foreground/70 hover:text-foreground",
          ],
          variant === "today" && [
            "border-border/60 hover:border-border",
            "bg-background hover:bg-muted/50",
            "text-foreground/70 hover:text-foreground",
            "font-semibold px-4",
          ],
          
          // Sizes
          size === "default" && "h-9 w-9 text-sm",
          size === "sm" && variant === "today" ? "h-8 text-xs" : "h-8 w-8 text-xs",
          
          className
        )}
        {...props}
      />
    );
  }
);

NavButton.displayName = "NavButton";

export { NavButton };
