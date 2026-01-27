"use client";

import { CalendarClock, ClipboardList } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to exclude FullCalendar from server bundle
const FullCalendarTimeline = dynamic(
  () => import("@/components/calendar/fullcalendar-timeline").then((mod) => mod.FullCalendarTimeline),
  { ssr: false }
);
import { BacklogSidebar } from "@/components/backlog/backlog-sidebar";
import { LucideIcon } from "lucide-react";

export type Panel = {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
};

export const PANELS: Panel[] = [
  {
    id: "timeline",
    title: "Timeline",
    icon: CalendarClock,
    component: FullCalendarTimeline,
  },
  {
    id: "backlog",
    title: "Backlog",
    icon: ClipboardList,
    component: BacklogSidebar,
  },
];
