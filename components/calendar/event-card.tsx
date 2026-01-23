"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isPast } from "date-fns";
import { calculateDuration } from "@/lib/utils/calendar";
import { getEventColor, getEventLightBackground } from "@/lib/utils/event-colors";
import { MIN_EVENT_HEIGHT_PX } from "@/lib/constants/calendar";
import { Calendar } from "lucide-react";
import type { CalendarEvent } from "@/lib/api/types";

/** CalendarEvent with parsed Date objects (not strings) */
export type ParsedCalendarEvent = Omit<CalendarEvent, 'startTime' | 'endTime'> & {
  startTime: Date;
  endTime: Date;
};

export type EventCardProps = {
  event: ParsedCalendarEvent;
  onClick?: (eventId: string) => void;
  style?: React.CSSProperties;
  className?: string;
  compact?: boolean;
  /** Pixels per minute for height calculation. If undefined, height will be controlled by parent */
  pixelsPerMinute?: number;
};

export function EventCard({
  event,
  onClick,
  style,
  className,
  compact = false,
  pixelsPerMinute,
}: EventCardProps) {
  const eventColor = getEventColor(event);
  const backgroundColor = getEventLightBackground(event);
  const isPastEvent = isPast(event.endTime);

  // Calculate height based on duration if pixelsPerMinute is specified
  let heightStyle: React.CSSProperties | undefined;
  if (pixelsPerMinute !== undefined) {
    const durationMinutes = calculateDuration(event.startTime, event.endTime);
    const calculatedHeight = durationMinutes * pixelsPerMinute;
    const height = Math.max(calculatedHeight, MIN_EVENT_HEIGHT_PX);
    heightStyle = { height: `${height}px` };
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.01 }}
      style={{
        ...style,
        ...heightStyle,
      }}
      className={className}
    >
      <div
        className={cn(
          "relative px-2 py-1.5 rounded cursor-pointer transition-all duration-200 h-full flex items-center gap-1.5",
          "border border-solid",
          isPastEvent && "opacity-50"
        )}
        style={{
          borderColor: eventColor,
          backgroundColor,
        }}
        onClick={() => onClick?.(event.id)}
      >
        {/* Badge pour les événements externes */}
        {event.source !== 'miniorg' && (
          <div title={`From ${event.source}`} className="flex-shrink-0">
            <Calendar 
              className="h-3 w-3" 
              style={{ color: eventColor }}
            />
          </div>
        )}
        
        {/* Titre */}
        <p
          className={cn(
            "text-xs font-medium leading-tight truncate flex-1",
            compact && "text-[11px]"
          )}
          style={{ color: eventColor }}
        >
          {event.title}
        </p>
      </div>
    </motion.div>
  );
}
