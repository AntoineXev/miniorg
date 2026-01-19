"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  showText?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

const dotVariants = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.15,
      ease: "easeInOut",
    },
  }),
};

export function Loader({ 
  size = "md", 
  text, 
  showText = false,
  className 
}: LoaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo avec effet ping */}
      <span className={cn("relative flex", sizeMap[size])}>
        {/* Ping animé (onde qui se propage) */}
        <span 
          className="absolute inline-flex h-full w-full animate-ping rounded-[20%] bg-[#EE6B2F] opacity-40"
        />
        {/* Logo principal */}
        <span className="relative inline-flex rounded-[20%] bg-[#D95F20]" style={{ width: '100%', height: '100%' }} />
      </span>

      {/* Texte de chargement animé */}
      {showText && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{text || "Chargement"}</span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                custom={i}
                variants={dotVariants}
                animate="animate"
                className="inline-block"
              >
                .
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
