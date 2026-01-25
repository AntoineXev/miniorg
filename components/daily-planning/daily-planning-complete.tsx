"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/api/types";

type DailyPlanningCompleteProps = {
  highlight?: Task | null;
  onEdit: () => void;
};

export function DailyPlanningComplete({ highlight, onEdit }: DailyPlanningCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-semibold mb-2"
      >
        Your day is ready!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground/90 text-center text-xs max-w-sm"
      >
        Your daily ritual has been saved. Check your timeline to see your planned tasks.
      </motion.p>

      {highlight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-md bg-primary/5 border border-primary/20 max-w-sm"
        >
          <p className="text-xs text-primary mb-1">Today&apos;s highlight</p>
          <p className="font-medium">{highlight.title}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8"
      >
        <Button variant="outline" className="bg-card" onClick={onEdit}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          (Re)edit planning
        </Button>
      </motion.div>
    </motion.div>
  );
}
