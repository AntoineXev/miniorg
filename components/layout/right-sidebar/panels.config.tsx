import { CalendarClock, ClipboardList } from "lucide-react";
import { TimelineSidebar } from "@/components/calendar/timeline-sidebar";
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
    component: TimelineSidebar,
  },
  {
    id: "backlog",
    title: "Backlog",
    icon: ClipboardList,
    component: BacklogSidebar,
  },
];
