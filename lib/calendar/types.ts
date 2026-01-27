export type CalendarProvider = 'google' | 'outlook' | 'apple';

export interface ExternalCalendar {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  accessRole: string;
}

export interface ExternalEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  color?: string;
  isAllDay?: boolean;
  status?: string;
  attendees?: string[];
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}

export interface CalendarAdapter {
  // Authentification
  getAuthUrl(redirectUri: string, state: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenSet>;
  refreshAccessToken(refreshToken: string): Promise<TokenSet>;
  
  // Gestion des calendriers
  listCalendars(accessToken: string): Promise<ExternalCalendar[]>;
  
  // Gestion des événements
  listEvents(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date,
    syncToken?: string
  ): Promise<{ events: ExternalEvent[]; nextSyncToken?: string }>;
  
  createEvent(
    accessToken: string,
    calendarId: string,
    event: Omit<ExternalEvent, 'id'>
  ): Promise<ExternalEvent>;
  
  updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<ExternalEvent>
  ): Promise<ExternalEvent>;
  
  deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void>;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
}
