import { prisma } from '@/lib/prisma';
import { CalendarService } from './calendar-service';
import { CalendarProvider } from './types';
import { addMinutes } from 'date-fns';

export async function ensureValidToken(connectionId: string): Promise<string> {
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  if (!connection.accessToken) {
    throw new Error('No access token available');
  }

  // Si le token expire dans moins de 5 minutes, le refresh
  if (connection.expiresAt && connection.expiresAt < addMinutes(new Date(), 5)) {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Pour éviter une référence circulaire, on crée l'adapter directement
    const { GoogleCalendarAdapter } = await import('./google-adapter');
    const adapter = new GoogleCalendarAdapter();

    try {
      const newTokens = await adapter.refreshAccessToken(connection.refreshToken);

      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return connection.accessToken;
}
