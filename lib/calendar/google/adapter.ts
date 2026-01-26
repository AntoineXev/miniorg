import {
  CalendarAdapter,
  ExternalCalendar,
  ExternalEvent,
  TokenSet,
} from '../types';
import { GoogleOAuthClient } from './oauth-client';
import { GoogleCalendarClient } from './calendar-client';

/**
 * Adapter Google Calendar
 * Implémente CalendarAdapter en utilisant fetch() au lieu de googleapis
 */
export class GoogleCalendarAdapter implements CalendarAdapter {
  private readonly oauthClient: GoogleOAuthClient;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    this.oauthClient = new GoogleOAuthClient(clientId, clientSecret);
  }

  getAuthUrl(redirectUri: string, state: string): string {
    return this.oauthClient.generateAuthUrl({
      redirect_uri: redirectUri,
      scope: ['https://www.googleapis.com/auth/calendar'],
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<TokenSet> {
    const tokens = await this.oauthClient.getToken({
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      scope: tokens.scope || '',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    const tokens = await this.oauthClient.refreshToken(refreshToken);

    if (!tokens.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken || undefined,
      expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      scope: tokens.scope || '',
    };
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    const client = new GoogleCalendarClient(accessToken);
    const response = await client.listCalendars();

    return (response.items || []).map((item) => ({
      id: item.id,
      name: item.summary || 'Unnamed Calendar',
      description: item.description || undefined,
      backgroundColor: item.backgroundColor || undefined,
      accessRole: item.accessRole || 'reader',
    }));
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date,
    syncToken?: string
  ): Promise<{ events: ExternalEvent[]; nextSyncToken?: string }> {
    const client = new GoogleCalendarClient(accessToken);

    const params: any = {
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (syncToken) {
      params.syncToken = syncToken;
    } else {
      params.timeMin = startDate.toISOString();
      params.timeMax = endDate.toISOString();
    }

    const response = await client.listEvents(calendarId, params);

    const events = (response.items || [])
      .filter((item) => item.status !== 'cancelled')
      .filter((item) => {
        // Exclure les événements workingLocation (Bureau/Maison) et outOfOffice
        // Conserver les événements default, focusTime, birthday, fromGmail, etc.
        const eventType = item.eventType || 'default';
        return eventType !== 'workingLocation' && eventType !== 'outOfOffice';
      })
      .map((item) => {
        const startTime = item.start?.dateTime
          ? new Date(item.start.dateTime)
          : item.start?.date
          ? new Date(item.start.date)
          : new Date();

        const endTime = item.end?.dateTime
          ? new Date(item.end.dateTime)
          : item.end?.date
          ? new Date(item.end.date)
          : new Date();

        return {
          id: item.id,
          title: item.summary || 'Untitled Event',
          description: item.description || undefined,
          startTime,
          endTime,
          location: item.location || undefined,
          color: item.colorId || undefined,
          isAllDay: !!item.start?.date,
          status: item.status || undefined,
          attendees: item.attendees?.map((a) => a.email),
        };
      });

    return {
      events,
      nextSyncToken: response.nextSyncToken || undefined,
    };
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: Omit<ExternalEvent, 'id'>
  ): Promise<ExternalEvent> {
    const client = new GoogleCalendarClient(accessToken);

    const eventData = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
      end: event.isAllDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString(), timeZone: 'UTC' },
      colorId: event.color,
      attendees: event.attendees?.map((email) => ({ email })),
    };

    const data = await client.insertEvent(calendarId, eventData);

    return {
      id: data.id,
      title: data.summary || event.title,
      description: data.description || event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: data.location || undefined,
      color: data.colorId || undefined,
      isAllDay: event.isAllDay,
      status: data.status || undefined,
      attendees: event.attendees,
    };
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<ExternalEvent>
  ): Promise<ExternalEvent> {
    const client = new GoogleCalendarClient(accessToken);

    const eventData: any = {};

    if (event.title !== undefined) eventData.summary = event.title;
    if (event.description !== undefined)
      eventData.description = event.description;
    if (event.location !== undefined) eventData.location = event.location;
    if (event.color !== undefined) eventData.colorId = event.color;

    if (event.startTime !== undefined) {
      eventData.start = event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString(), timeZone: 'UTC' };
    }

    if (event.endTime !== undefined) {
      eventData.end = event.isAllDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString(), timeZone: 'UTC' };
    }

    if (event.attendees !== undefined) {
      eventData.attendees = event.attendees.map((email) => ({ email }));
    }

    const data = await client.patchEvent(calendarId, eventId, eventData);

    const startTime = data.start?.dateTime
      ? new Date(data.start.dateTime)
      : data.start?.date
      ? new Date(data.start.date)
      : new Date();

    const endTime = data.end?.dateTime
      ? new Date(data.end.dateTime)
      : data.end?.date
      ? new Date(data.end.date)
      : new Date();

    return {
      id: data.id,
      title: data.summary || 'Untitled Event',
      description: data.description || undefined,
      startTime,
      endTime,
      location: data.location || undefined,
      color: data.colorId || undefined,
      isAllDay: !!data.start?.date,
      status: data.status || undefined,
      attendees: data.attendees?.map((a) => a.email),
    };
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const client = new GoogleCalendarClient(accessToken);
    await client.deleteEvent(calendarId, eventId);
  }
}
