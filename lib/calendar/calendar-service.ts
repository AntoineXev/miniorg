import { CalendarAdapter, CalendarProvider } from './types';
import { GoogleCalendarAdapter } from './google';
import { prisma } from '@/lib/prisma';
import { ensureValidToken } from './token-manager';

export class CalendarService {
  private adapters: Map<CalendarProvider, CalendarAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('google', new GoogleCalendarAdapter());
    // Futurs adapters: this.adapters.set('outlook', new OutlookAdapter());
  }

  getAdapter(provider: CalendarProvider): CalendarAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${provider}`);
    }
    return adapter;
  }

  async syncConnection(
    connectionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    // Récupérer la connexion depuis la DB
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Vérifier et rafraîchir le token si nécessaire
    const validToken = await ensureValidToken(connectionId);

    // Récupérer l'adapter approprié
    const adapter = this.getAdapter(connection.provider as CalendarProvider);

    // Récupérer les événements avec le bon adapter
    const { events, nextSyncToken } = await adapter.listEvents(
      validToken,
      connection.calendarId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
      endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours en avance
      connection.syncToken || undefined
    );

    // Merger avec les événements locaux
    for (const externalEvent of events) {
      // Chercher si l'événement existe déjà
      const existingEvent = await prisma.calendarEvent.findFirst({
        where: {
          externalId: externalEvent.id,
          connectionId: connection.id,
        },
      });

      if (existingEvent) {
        // Mettre à jour l'événement existant
        // Comparer les timestamps pour déterminer quelle version est la plus récente
        const externalUpdated = externalEvent.startTime; // Approximation, Google n'expose pas updatedAt
        const localUpdated = existingEvent.updatedAt;

        // Pour la simplicité, on privilégie toujours la version externe (Google)
        // sauf si l'événement local a été modifié manuellement (taskId != null)
        if (!existingEvent.taskId) {
          await prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: {
              title: externalEvent.title,
              description: externalEvent.description,
              startTime: externalEvent.startTime,
              endTime: externalEvent.endTime,
              isAllDay: externalEvent.isAllDay ?? false,
              color: externalEvent.color,
              responseStatus: externalEvent.responseStatus,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
            },
          });
        }
      } else {
        // Créer un nouvel événement local
        await prisma.calendarEvent.create({
          data: {
            title: externalEvent.title,
            description: externalEvent.description,
            startTime: externalEvent.startTime,
            endTime: externalEvent.endTime,
            isAllDay: externalEvent.isAllDay ?? false,
            color: externalEvent.color,
            responseStatus: externalEvent.responseStatus,
            userId: connection.userId,
            source: connection.provider,
            externalId: externalEvent.id,
            connectionId: connection.id,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
          },
        });
      }
    }

    // Gérer les événements supprimés (si on utilise le syncToken)
    // Pour l'instant, on ne gère pas les suppressions automatiques

    // Mettre à jour le syncToken pour la prochaine sync incrémentale
    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        syncToken: nextSyncToken,
        lastSyncAt: new Date(),
      },
    });
  }

  async exportEvent(
    connectionId: string,
    eventId: string
  ): Promise<void> {
    // Récupérer l'événement local
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Récupérer la connexion
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Vérifier et rafraîchir le token si nécessaire
    const validToken = await ensureValidToken(connectionId);

    // Récupérer l'adapter approprié
    const adapter = this.getAdapter(connection.provider as CalendarProvider);

    // Créer l'événement sur le calendrier externe
    const externalEvent = await adapter.createEvent(
      validToken,
      connection.calendarId,
      {
        title: event.title,
        description: event.description || undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color || undefined,
      }
    );

    // Mettre à jour l'événement local avec l'externalId
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        externalId: externalEvent.id,
        connectionId: connection.id,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });
  }

  async updateExportedEvent(eventId: string): Promise<void> {
    console.log("[CalendarService] updateExportedEvent called for:", eventId);

    // Récupérer l'événement local
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { connection: true },
    });

    if (!event || !event.externalId || !event.connection) {
      console.error("[CalendarService] Event not found or not exported:", {
        eventId,
        hasEvent: !!event,
        hasExternalId: event?.externalId,
        hasConnection: !!event?.connection,
      });
      throw new Error('Event not found or not exported');
    }

    console.log("[CalendarService] Preparing to update external event:", {
      externalId: event.externalId,
      calendarId: event.connection.calendarId,
      provider: event.connection.provider,
    });

    // Vérifier et rafraîchir le token si nécessaire
    const validToken = await ensureValidToken(event.connection.id);

    // Récupérer l'adapter approprié
    const adapter = this.getAdapter(event.connection.provider as CalendarProvider);

    // Mettre à jour l'événement sur le calendrier externe
    console.log("[CalendarService] Calling adapter.updateEvent with:", {
      calendarId: event.connection.calendarId,
      externalId: event.externalId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
    });

    await adapter.updateEvent(
      validToken,
      event.connection.calendarId,
      event.externalId,
      {
        title: event.title,
        description: event.description || undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color || undefined,
      }
    );

    console.log("[CalendarService] Successfully updated external event");

    // Mettre à jour le statut de sync
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });
  }

  async deleteExportedEvent(eventId: string): Promise<void> {
    // Récupérer l'événement local
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { connection: true },
    });

    if (!event || !event.externalId || !event.connection) {
      // Si l'événement n'est pas exporté, on le supprime juste localement
      return;
    }

    try {
      // Vérifier et rafraîchir le token si nécessaire
      const validToken = await ensureValidToken(event.connection.id);

      // Récupérer l'adapter approprié
      const adapter = this.getAdapter(event.connection.provider as CalendarProvider);

      // Supprimer l'événement du calendrier externe
      await adapter.deleteEvent(
        validToken,
        event.connection.calendarId,
        event.externalId
      );
    } catch (error) {
      console.error('Failed to delete external event:', error);
      // On continue quand même pour supprimer l'événement local
    }
  }
}
