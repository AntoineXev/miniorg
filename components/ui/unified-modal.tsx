"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type UnifiedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Header
  headerValue: string;
  headerPlaceholder?: string;
  onHeaderChange?: (value: string) => void;
  headerDisabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  customHeader?: React.ReactNode;
  
  // Checkbox (for completion)
  showCheckbox?: boolean;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  
  // Body - content before show more
  children?: React.ReactNode;
  
  // Show more section
  showMoreContent?: React.ReactNode;
  showMoreExpanded?: boolean;
  onShowMoreToggle?: (expanded: boolean) => void;
  
  // Footer
  footerLeftActions?: React.ReactNode;
  hideFooter?: boolean;
  
  // External actions
  actionButtons?: React.ReactNode;
  
  // Keyboard hints
  keyboardHints?: React.ReactNode;
  
  // Modal sizing
  maxWidth?: string;
};

export function UnifiedModal({
  open,
  onOpenChange,
  headerValue,
  headerPlaceholder = "Title",
  onHeaderChange,
  headerDisabled = false,
  onKeyDown,
  customHeader,
  showCheckbox = false,
  checkboxChecked = false,
  onCheckboxChange,
  children,
  showMoreContent,
  showMoreExpanded: controlledShowMore,
  onShowMoreToggle,
  footerLeftActions,
  hideFooter = false,
  actionButtons,
  keyboardHints,
  maxWidth = "sm:max-w-[600px]",
}: UnifiedModalProps) {
  // Internal state for show more if not controlled
  const [internalShowMore, setInternalShowMore] = useState(false);
  
  const showMore = controlledShowMore !== undefined ? controlledShowMore : internalShowMore;
  const setShowMore = (value: boolean) => {
    if (onShowMoreToggle) {
      onShowMoreToggle(value);
    } else {
      setInternalShowMore(value);
    }
  };

  // Reset internal show more when modal closes
  useEffect(() => {
    if (!open && controlledShowMore === undefined) {
      setInternalShowMore(false);
    }
  }, [open, controlledShowMore]);

  // Always show the show more button and content is always there
  const hasContent = !!children || !!showMoreContent;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className={`${maxWidth} p-0 gap-0 border-0 shadow-2xl`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Header - Main input area */}
            <div className={cn("py-4 border-b", !showMore && hasContent && "border-b-0")}>
              <div className="flex items-center gap-3 px-4">
                {showCheckbox && onCheckboxChange && (
                  <AnimatedCheckbox
                    checked={checkboxChecked}
                    onChange={onCheckboxChange}
                  />
                )}
                {customHeader || (
                  <Input
                    placeholder={headerPlaceholder}
                    value={headerValue}
                    onChange={onHeaderChange ? (e) => onHeaderChange(e.target.value) : undefined}
                    onKeyDown={onKeyDown}
                    disabled={headerDisabled}
                    autoFocus={!headerDisabled && !showCheckbox}
                    className={cn(
                      "flex-1 text-lg bg-transparent border-0 focus-visible:ring-offset-0 focus-visible:ring-0 px-0 text-foreground placeholder:text-muted-foreground font-medium disabled:opacity-100 disabled:cursor-default transition-all duration-200",
                      checkboxChecked && "line-through text-muted-foreground opacity-60"
                    )}
                  />
                )}
              </div>
            </div>

            {/* Expandable content section */}
            <AnimatePresence>
              {showMore && hasContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-4 space-y-3">
                    {children}
                    {showMoreContent}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer toolbar */}
            {!hideFooter && (
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-t bg-background">
                {/* Left side - Custom actions */}
                <div className="flex items-center gap-2 w-full">
                  {footerLeftActions}
                </div>

                {/* Right side - Show more toggle (always visible if there's content) */}
                {hasContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMore(!showMore)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    <span>{showMore ? "Show less" : "Show more"}</span>
                    { !showMore && (
                    <Plus
                    className={`h-4 w-4 ml-1 transition-transform ${
                      showMore ? "rotate-90" : ""
                    }`}
                    strokeWidth={1}
                  />
                    )}
{ showMore && (
                    <Minus
                    className={`h-4 w-4 ml-1 transition-transform ${
                      !showMore ? "rotate-90" : ""
                    }`}
                    strokeWidth={1}
                  />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons - outside modal */}
            {actionButtons && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute -bottom-16 right-0 flex gap-2"
              >
                {actionButtons}
              </motion.div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Keyboard hints at bottom of screen - outside modal */}
      <AnimatePresence>
        {open && keyboardHints && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-0 right-0 z-[100] pointer-events-none flex justify-center"
          >
            <div className="flex items-center justify-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg">
              {keyboardHints}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
