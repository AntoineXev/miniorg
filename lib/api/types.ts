// Centralized API types for the application

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  deadlineSetAt?: Date | null;
  duration?: number | null;
  completedAt?: Date | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  calendarEvents?: Array<{ id: string; startTime: Date | string; endTime: Date | string }>;
  createdAt: Date;
  updatedAt: Date;
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
