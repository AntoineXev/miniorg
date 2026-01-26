"use client";

import { Scale } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressIndicator } from "../ui/progress-indicator";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";
import { TagList } from "@/components/tags/tag-list";

type StepContextsProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function StepContexts({ onComplete, onSkip }: StepContextsProps) {
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
            <ProgressIndicator current={6} total={6} />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-[28px] font-semibold text-gray-900"
            >
              Organize with contexts
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-base text-gray-500 leading-relaxed"
            >
              Create tags to categorize your tasks: Work, Personal, Projects... You can track time spent on each area of your life.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <FeatureCard
                icon={Scale}
                title="Work/life balance"
                description="Visualize how you split your time between work and personal life."
              />
            </motion.div>

            {/* Tag list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <TagList />
            </motion.div>
          </div>
        </div>

        {/* CTA Section - Always visible at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="pt-6 space-y-3 flex-shrink-0"
        >
          <button
            onClick={onComplete}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors"
          >
            Finish and start
          </button>

          <button
            onClick={onSkip}
            className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors py-2"
          >
            Skip this step
          </button>
        </motion.div>
      </div>

      {/* Right side - Preview (60%) */}
      <div className="w-[60%] h-full py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="h-full"
        >
          <PreviewContainer>
            <img
              src="/images/step6-contexts.svg"
              alt="Contexts and channels"
              className="h-full w-auto"
            />
          </PreviewContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
