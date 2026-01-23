import { CalendarClock, ClipboardList } from "lucide-react";
import { FullCalendarTimeline } from "@/components/calendar/fullcalendar-timeline";
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
