"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isPast } from "date-fns";
import { calculateDuration } from "@/lib/calendar-utils";
import { Calendar } from "lucide-react";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  taskId?: string | null;
  color?: string | null;
  isCompleted: boolean;
  source: string;
  task?: {
    id: string;
    title: string;
    tags?: Array<{ id: string; name: string; color: string }>;
  } | null;
};

export type EventCardProps = {
  event: CalendarEvent;
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
  // Déterminer la couleur selon les règles:
  // - Si lié à une tâche -> couleur primaire miniorg
  // - Sinon -> couleur du calendrier (gris par défaut pour miniorg)
  const eventColor = event.taskId 
    ? "hsl(17 78% 62%)" // Couleur primaire miniorg
    : event.color || "#9ca3af"; // Couleur du calendrier ou gris par défaut
  
  // Vérifier si l'événement est passé
  const isPastEvent = isPast(event.endTime);
  
  // Calculer la hauteur en fonction de la durée si pixelsPerMinute est spécifié
  let heightStyle: React.CSSProperties | undefined;
  if (pixelsPerMinute !== undefined) {
    const durationMinutes = calculateDuration(event.startTime, event.endTime);
    const calculatedHeight = durationMinutes * pixelsPerMinute;
    const minHeight = 24; // Hauteur minimale pour qu'on puisse voir le titre
    const height = Math.max(calculatedHeight, minHeight);
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
          backgroundColor: `${eventColor}10`,
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
