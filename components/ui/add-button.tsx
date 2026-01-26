"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AddButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  rightContent?: React.ReactNode;
};

export function AddButton({ onClick, children, className, rightContent }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground/70 hover:text-foreground rounded-lg transition-all border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 group",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
        <span className="font-medium">{children}</span>
      </div>
      {rightContent}
    </button>
  );
}
