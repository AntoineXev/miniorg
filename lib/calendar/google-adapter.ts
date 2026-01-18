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
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      // Note: redirect_uri will be passed dynamically in getToken
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
    const result = await this.oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    // Parse tokens if it's a string (sometimes googleapis returns stringified JSON)
    let tokens = result.tokens;
    if (typeof tokens === 'string') {
      tokens = JSON.parse(tokens);
    }

    const accessToken = tokens.access_token?.toString().trim();
    const refreshToken = tokens.refresh_token?.toString().trim();

    if (!accessToken) {
      throw new Error('No access token received. Check Google Console OAuth configuration and scopes.');
    }

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      scope: tokens.scope || '',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    // Parse credentials if it's a string
    let creds = credentials;
    if (typeof creds === 'string') {
      creds = JSON.parse(creds);
    }

    if (!creds.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: creds.access_token,
      refreshToken: creds.refresh_token || refreshToken || undefined,
      expiresAt: new Date(creds.expiry_date || Date.now() + 3600 * 1000),
      scope: creds.scope || '',
    };
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.calendarList.list();
    
    // Parse response.data if it's a string
    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    return (data.items || []).map((item: any) => ({
      id: item.id!,
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
    
    // Parse response.data if it's a string
    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    const events = (data.items || [])
      .filter((item: any) => item.status !== 'cancelled')
      .map((item: any) => {
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
          description: item.description || undefined,
          startTime,
          endTime,
          location: item.location || undefined,
          color: item.colorId || undefined,
          isAllDay: !!item.start?.date,
          status: item.status || undefined,
          attendees: item.attendees?.map((a: any) => a.email!),
        };
      });

    return {
      events,
      nextSyncToken: data.nextSyncToken || undefined,
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

    // Parse response.data if it's a string
    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    return {
      id: data.id!,
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

    // Parse response.data if it's a string
    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

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
      id: data.id!,
      title: data.summary || 'Untitled Event',
      description: data.description || undefined,
      startTime,
      endTime,
      location: data.location || undefined,
      color: data.colorId || undefined,
      isAllDay: !!data.start?.date,
      status: data.status || undefined,
      attendees: data.attendees?.map((a: any) => a.email!),
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
