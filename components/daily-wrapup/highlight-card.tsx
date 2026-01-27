"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Clock, Check } from "lucide-react";
import type { Task } from "@/lib/api/types";
import { format, parseISO } from "date-fns";

type HighlightCardProps = {
  highlight: Task | null | undefined;
};

// Confetti particle component
function ConfettiParticle({
  color,
  delay,
  x,
  y
}: {
  color: string;
  delay: number;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      animate={{
        opacity: 0,
        scale: 0,
        x: x,
        y: y,
        rotate: 720,
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.15, 0.85, 0.35, 1],
      }}
    />
  );
}

// Generate confetti particles
function Confetti({ show }: { show: boolean }) {
  const particles = useMemo(() => {
    const colors = ["#4ade80", "#22c55e", "#86efac", "#fbbf24", "#f59e0b"];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.15,
      x: (Math.random() - 0.5) * 150,
      y: -50 - Math.random() * 80,
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </div>
  );
}

// Status dot with ping animation
function StatusDot({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="relative">
      {isCompleted && (
        <motion.div
          className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400"
          animate={{ scale: [1, 2, 2], opacity: [0.8, 0, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.div
        className={`relative w-2.5 h-2.5 rounded-full ${
          isCompleted ? "bg-green-400" : "bg-muted-foreground/50"
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 25 }}
      />
    </div>
  );
}

export function HighlightCard({ highlight }: HighlightCardProps) {
  const isCompleted = highlight?.status === "done";

  // Calculate time info from calendar events
  const timeInfo = useMemo(() => {
    if (!highlight?.calendarEvents || highlight.calendarEvents.length === 0) {
      return { timeLogged: null, startTime: null, endTime: null };
    }

    const events = highlight.calendarEvents;
    let totalMinutes = 0;
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;

    events.forEach((event) => {
      const start = typeof event.startTime === "string" ? parseISO(event.startTime) : event.startTime;
      const end = typeof event.endTime === "string" ? parseISO(event.endTime) : event.endTime;

      totalMinutes += Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      if (!earliestStart || start < earliestStart) earliestStart = start;
      if (!latestEnd || end > latestEnd) latestEnd = end;
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeLogged = hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}min` : ""}`.trim()
      : `${mins}min`;

    return {
      timeLogged,
      startTime: earliestStart ? format(earliestStart, "HH:mm") : null,
      endTime: latestEnd ? format(latestEnd, "HH:mm") : null,
    };
  }, [highlight]);

  // Empty state
  if (!highlight) {
    return (
      <div className="bg-zinc-100 rounded-xl pt-3 pb-1.5 px-1.5">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          <span className="text-sm font-medium text-muted-foreground">
            Highlight du jour
          </span>
        </div>
        <div className="rounded-lg bg-card border border-border px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No highlight set for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible">
      {/* Confetti on completion */}
      <AnimatePresence>
        {isCompleted && <Confetti show={isCompleted} />}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Card pop effect on completion */}
        <motion.div
          animate={isCompleted ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
        >
          {/* Outer card */}
          <div className="bg-zinc-100 rounded-xl pt-3 pb-1.5 px-1.5 rounded-xl">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                <span className="text-sm font-medium text-muted-foreground">
                  Highlight du jour
                </span>
              </div>
              <StatusDot isCompleted={isCompleted} />
            </div>

            {/* Inner card */}
            <motion.div
              className={`rounded-lg overflow-hidden ${
                isCompleted ? "bg-green-500" : "bg-card border border-border"
              }`}
              animate={{ backgroundColor: isCompleted ? "#22c55e" : undefined }}
              transition={{ duration: 0.3 }}
            >
              {/* Main content */}
              <div className="px-4 py-4">
                {/* Time badge */}
                {timeInfo.timeLogged && (
                  <motion.div
                    className="flex items-center gap-3 mb-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                        isCompleted
                          ? "bg-black/15 text-white/90"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {timeInfo.timeLogged}
                    </div>
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  className={`text-lg font-semibold leading-snug ${
                    isCompleted ? "text-white" : "text-foreground"
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  {highlight.title}
                </motion.h2>
              </div>

              {/* Footer */}
              <div
                className={`px-3 py-2 flex items-center justify-between ${
                  isCompleted
                    ? "bg-black/10"
                    : "bg-muted/50 border-t border-border"
                }`}
              >
                <motion.span
                  className={`text-sm ${
                    isCompleted ? "text-white/80" : "text-muted-foreground"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {timeInfo.startTime && timeInfo.endTime
                    ? `${timeInfo.startTime} → ${timeInfo.endTime}`
                    : highlight.duration
                    ? `${Math.floor(highlight.duration / 60)}h ${highlight.duration % 60}min`
                    : ""}
                </motion.span>

                {/* Status */}
                <motion.div
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    isCompleted ? "text-white/90" : "text-muted-foreground"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  {isCompleted && (
                    <motion.span
                      className="flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 500,
                        damping: 15,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.span>
                  )}
                  {isCompleted ? "Accompli" : "Non complété"}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
