// Centralized API types for the application

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  type?: string | null; // "normal" | "highlight"
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  deadlineSetAt?: Date | null;
  duration?: number | null;
  completedAt?: Date | null;
  tag?: { id: string; name: string; color: string } | null;
  calendarEvents?: Array<{ id: string; startTime: Date | string; endTime: Date | string }>;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskInput = Omit<Partial<Task>, 'tag' | 'calendarEvents' | 'createdAt' | 'updatedAt'> & {
  tagId?: string | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  taskId?: string | null;
  color?: string | null;
  isCompleted?: boolean;
  source?: "miniorg" | "google" | "outlook";
  task?: Task | null;
  externalId?: string | null;
  connectionId?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  userId: string;
  isPersonal: boolean;
  isDefault: boolean;
  parentId?: string | null;
  children?: Tag[];
  createdAt: Date;
};

export type CalendarConnection = {
  id: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  userId: string;
};

export type DailyRitual = {
  id: string;
  date: Date | string;
  userId: string;
  highlightId?: string | null;
  highlight?: Task | null;
  timeline?: string | null; // JSON string of task IDs
  createdAt: Date;
  updatedAt: Date;
};
