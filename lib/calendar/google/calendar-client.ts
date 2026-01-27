/**
 * Client pour Google Calendar API v3
 * Toutes les méthodes utilisent fetch() au lieu de googleapis
 */
export class GoogleCalendarClient {
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Helper pour faire des requêtes authentifiées
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Google Calendar API error: ${response.status} ${error}`
      );
    }

    // DELETE renvoie 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Liste tous les calendriers de l'utilisateur
   */
  async listCalendars(): Promise<GoogleCalendarListResponse> {
    return this.request<GoogleCalendarListResponse>('/users/me/calendarList');
  }

  /**
   * Liste les événements d'un calendrier
   */
  async listEvents(
    calendarId: string,
    params: GoogleListEventsParams
  ): Promise<GoogleEventsResponse> {
    const url = new URL(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`
    );

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list events: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Crée un événement
   */
  async insertEvent(
    calendarId: string,
    eventData: GoogleEventInsert
  ): Promise<GoogleEvent> {
    return this.request<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    );
  }

  /**
   * Modifie un événement (PATCH partiel)
   */
  async patchEvent(
    calendarId: string,
    eventId: string,
    eventData: Partial<GoogleEventInsert>
  ): Promise<GoogleEvent> {
    console.log("[GoogleCalendarClient] patchEvent:", {
      calendarId,
      eventId,
      eventData,
    });
    const result = await this.request<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
        eventId
      )}`,
      {
        method: 'PATCH',
        body: JSON.stringify(eventData),
      }
    );
    console.log("[GoogleCalendarClient] patchEvent success:", result.id);
    return result;
  }

  /**
   * Supprime un événement
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    return this.request<void>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
        eventId
      )}`,
      {
        method: 'DELETE',
      }
    );
  }
}

/**
 * Types pour les réponses Google Calendar API
 */
export interface GoogleCalendarListResponse {
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    accessRole: string;
  }>;
}

export interface GoogleEventsResponse {
  items: GoogleEvent[];
  nextSyncToken?: string;
}

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  status: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{
    email: string;
    self?: boolean;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'birthday' | 'fromGmail';
  workingLocationProperties?: {
    type?: 'homeOffice' | 'officeLocation' | 'customLocation';
    homeOffice?: any;
    officeLocation?: {
      buildingId?: string;
      floorId?: string;
      floorSectionId?: string;
      deskId?: string;
      label?: string;
    };
    customLocation?: {
      label?: string;
    };
  };
  outOfOfficeProperties?: {
    autoDeclineMode?: string;
    declineMessage?: string;
  };
}

export interface GoogleEventInsert {
  summary: string;
  description?: string;
  location?: string;
  colorId?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string }>;
}

export interface GoogleListEventsParams {
  timeMin?: string;
  timeMax?: string;
  syncToken?: string;
  singleEvents?: boolean;
  orderBy?: string;
}
