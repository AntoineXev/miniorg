"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimatedCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "small";
};

export function AnimatedCheckbox({
  checked,
  onChange,
  disabled = false,
  className,
  size = "default",
}: AnimatedCheckboxProps) {
  const isSmall = size === "small" || className?.includes("w-5");
  
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200",
        "border focus:outline-none",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "cursor-pointer hover:scale-110",
        checked
          ? "bg-green-500 border-green-500 shadow-sm"
          : "bg-transparent border-border hover:border-muted-foreground",
        className
      )}
    >
      <motion.div
        initial={false}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        <Check 
          className={cn(
            "text-white",
            isSmall ? "w-3 h-3" : "w-4 h-4"
          )} 
          strokeWidth={isSmall ? 2.5 : 3} 
        />
      </motion.div>
      
      {/* Ripple effect on check */}
      <AnimatePresence>
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}
