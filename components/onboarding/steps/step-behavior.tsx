"use client";

import { Clock, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressIndicator } from "../ui/progress-indicator";
import { FeatureCard } from "../ui/feature-card";
import { PreviewContainer } from "../ui/preview-container";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useUserSettingsQuery } from "@/lib/api/queries/user-settings";
import { useUpdateUserSettingsMutation } from "@/lib/api/mutations/user-settings";

type StepBehaviorProps = {
  onNext: () => void;
  onSkip: () => void;
};

export function StepBehavior({ onNext, onSkip }: StepBehaviorProps) {
  const { data: settings, isLoading } = useUserSettingsQuery();
  const updateSettings = useUpdateUserSettingsMutation();

  const handleAutoMoveToggle = (checked: boolean) => {
    updateSettings.mutate({ autoMoveEventsOnComplete: checked });
  };

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
            <ProgressIndicator current={7} total={7} />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-[28px] font-semibold text-gray-900"
            >
              Customize your behavior
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-base text-gray-500 leading-relaxed"
            >
              Fine-tune how MiniOrg works for you. These settings help track your actual work patterns.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <FeatureCard
                icon={Settings2}
                title="Your workflow, your rules"
                description="All settings can be changed later in Settings > Behavior."
              />
            </motion.div>

            {/* Behavior settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Auto-move events on completion
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      When you complete a task, move its calendar event to end at the current time.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={settings?.autoMoveEventsOnComplete ?? true}
                      onCheckedChange={handleAutoMoveToggle}
                      disabled={isLoading || updateSettings.isPending}
                    />
                  </div>
                </div>
              </Card>
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
            onClick={onNext}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors"
          >
            Get started
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
              src="/images/step7-behavior.svg"
              alt="Behavior settings"
              className="h-full w-auto"
            />
          </PreviewContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
