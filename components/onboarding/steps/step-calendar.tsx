"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressIndicator } from "../ui/progress-indicator";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";
import { CalendarManager } from "@/components/calendar/calendar-manager";
import { useCalendarConnections } from "@/lib/hooks/use-calendar-connections";

type StepCalendarProps = {
  onNext: () => void;
  onSkip: () => void;
};

export function StepCalendar({ onNext, onSkip }: StepCalendarProps) {
  const { connections } = useCalendarConnections();
  const hasConnections = connections.length > 0;

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
            <ProgressIndicator current={5} total={7} />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-[28px] font-semibold text-gray-900"
            >
              Connect your calendar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-base text-gray-500 leading-relaxed"
            >
              Sync Google Calendar to see your meetings on the timeline. Your tasks and events coexist for a complete view of your day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <FeatureCard
                icon={RefreshCw}
                title="Auto sync"
                description="Your events update in real time. You can connect multiple calendars."
              />
            </motion.div>

            {/* Calendar manager */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <CalendarManager callbackUrl="/onboarding" />
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
          {hasConnections && (
            <button
              onClick={onNext}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}

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
              src="/images/step5-connect-calendar.svg"
              alt="Connect calendar"
              className="h-full w-auto"
            />
          </PreviewContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
