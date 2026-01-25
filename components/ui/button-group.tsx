"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: ButtonGroup
 * -------------------------------------------------------------------------- */

type ButtonGroupProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-orientation={orientation}
      className={cn(
        "inline-flex items-center rounded-md border border-input bg-background shadow-sm",
        // Rounded corners
        "[&>button:first-child]:rounded-l-md [&>button:first-child]:rounded-r-none",
        "[&>button:last-child]:rounded-r-md [&>button:last-child]:rounded-l-none",
        "[&>button:not(:first-child):not(:last-child)]:rounded-none",
        // Remove button borders and shadows, add separator via border-l
        "[&>button]:shadow-none [&>button]:border-0",
        "[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-input",
        orientation === "vertical" && [
          "flex-col",
          "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-b-none [&>button:first-child]:rounded-l-none",
          "[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-t-none [&>button:last-child]:rounded-r-none",
          "[&>button:not(:first-child)]:border-l-0 [&>button:not(:first-child)]:border-t [&>button:not(:first-child)]:border-input",
        ],
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupSeparator
 * -------------------------------------------------------------------------- */

type ButtonGroupSeparatorProps = React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
};

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <div
      role="separator"
      data-orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "vertical" ? "h-4 w-px" : "h-px w-4",
        className
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupText
 * -------------------------------------------------------------------------- */

type ButtonGroupTextProps = React.ComponentProps<"span"> & {
  asChild?: boolean;
};

function ButtonGroupText({
  asChild,
  className,
  ...props
}: ButtonGroupTextProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center px-3 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
};
