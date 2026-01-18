import {
  CalendarAdapter,
  ExternalCalendar,
  ExternalEvent,
  TokenSet,
} from './types';
import { google } from 'googleapis';

export class GoogleCalendarAdapter implements CalendarAdapter {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );
  }

  getAuthUrl(redirectUri: string, state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state,
      prompt: 'consent',
      redirect_uri: redirectUri,
    });
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<TokenSet> {
    // Le redirectUri doit être passé via les options getToken
    const { tokens } = await this.oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      scope: tokens.scope || '',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken || undefined,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
      scope: credentials.scope || '',
    };
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.calendarList.list();

    return (response.data.items || []).map((item) => ({
      id: item.id!,
      name: item.summary || 'Unnamed Calendar',
      description: item.description,
      backgroundColor: item.backgroundColor,
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
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const params: any = {
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
    };

    // Si on a un syncToken, on l'utilise pour la sync incrémentale
    if (syncToken) {
      params.syncToken = syncToken;
    } else {
      // Sinon, on récupère les événements dans la plage de dates
      params.timeMin = startDate.toISOString();
      params.timeMax = endDate.toISOString();
    }

    const response = await calendar.events.list(params);

    const events = (response.data.items || [])
      .filter((item) => item.status !== 'cancelled') // Filtrer les événements annulés
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
          id: item.id!,
          title: item.summary || 'Untitled Event',
          description: item.description,
          startTime,
          endTime,
          location: item.location,
          color: item.colorId,
          isAllDay: !!item.start?.date,
          status: item.status,
          attendees: item.attendees?.map((a) => a.email!),
        };
      });

    return {
      events,
      nextSyncToken: response.data.nextSyncToken,
    };
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: Omit<ExternalEvent, 'id'>
  ): Promise<ExternalEvent> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: event.isAllDay
          ? { date: event.startTime.toISOString().split('T')[0] }
          : { dateTime: event.startTime.toISOString() },
        end: event.isAllDay
          ? { date: event.endTime.toISOString().split('T')[0] }
          : { dateTime: event.endTime.toISOString() },
        colorId: event.color,
        attendees: event.attendees?.map((email) => ({ email })),
      },
    });

    const item = response.data;

    return {
      id: item.id!,
      title: item.summary || event.title,
      description: item.description || event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: item.location,
      color: item.colorId,
      isAllDay: event.isAllDay,
      status: item.status,
      attendees: event.attendees,
    };
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<ExternalEvent>
  ): Promise<ExternalEvent> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const requestBody: any = {};

    if (event.title !== undefined) requestBody.summary = event.title;
    if (event.description !== undefined) requestBody.description = event.description;
    if (event.location !== undefined) requestBody.location = event.location;
    if (event.color !== undefined) requestBody.colorId = event.color;

    if (event.startTime !== undefined) {
      requestBody.start = event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString() };
    }

    if (event.endTime !== undefined) {
      requestBody.end = event.isAllDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString() };
    }

    if (event.attendees !== undefined) {
      requestBody.attendees = event.attendees.map((email) => ({ email }));
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody,
    });

    const item = response.data;
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
      id: item.id!,
      title: item.summary || 'Untitled Event',
      description: item.description,
      startTime,
      endTime,
      location: item.location,
      color: item.colorId,
      isAllDay: !!item.start?.date,
      status: item.status,
      attendees: item.attendees?.map((a) => a.email!),
    };
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    await calendar.events.delete({
      calendarId,
      eventId,
    });
  }
}
