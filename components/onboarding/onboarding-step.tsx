"use client";

import { motion } from "framer-motion";
import { ProgressIndicator } from "./ui/progress-indicator";

type OnboardingStepProps = {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  ctaLabel: string;
  onCtaClick: () => void;
  skipLabel?: string;
  onSkip?: () => void;
};

export function OnboardingStep({
  step,
  totalSteps,
  title,
  description,
  leftContent,
  rightContent,
  ctaLabel,
  onCtaClick,
  skipLabel,
  onSkip,
}: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full w-full flex"
    >
      {/* Left side - Content (40%) */}
      <div className="w-[40%] h-full flex flex-col p-12">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-6">
            <ProgressIndicator current={step} total={totalSteps} />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-[28px] font-semibold text-gray-900"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-base text-gray-500 leading-relaxed"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {leftContent}
            </motion.div>
          </div>
        </div>

        {/* CTA Section - Always visible at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="pt-6 space-y-3 flex-shrink-0"
        >
          <button
            onClick={onCtaClick}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors"
          >
            {ctaLabel}
          </button>

          {skipLabel && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors py-2"
            >
              {skipLabel}
            </button>
          )}
        </motion.div>
      </div>

      {/* Right side - Preview (60%) */}
      <div className="w-[60%] h-full pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="h-full"
        >
          {rightContent}
        </motion.div>
      </div>
    </motion.div>
  );
}
