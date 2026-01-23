import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CalendarService } from '@/lib/calendar/calendar-service';
import { z } from 'zod';
import { getAuthorizedUser } from '@/lib/auth-tauri-server';

const syncSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/calendar-sync - Synchroniser tous les calendriers actifs de l'utilisateur
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const body = syncSchema.parse(json);

    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;

    const calendarService = new CalendarService();

    // Récupérer tous les calendriers actifs de l'utilisateur
    const connections = await prisma.calendarConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const results = [];

    for (const connection of connections) {
      try {
        await calendarService.syncConnection(connection.id, startDate, endDate);
        results.push({
          connectionId: connection.id,
          connectionName: connection.name,
          status: 'success',
        });
      } catch (error: any) {
        console.error(`Sync failed for connection ${connection.id}:`, error);
        results.push({
          connectionId: connection.id,
          connectionName: connection.name,
          status: 'error',
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      syncedCount: results.filter((r) => r.status === 'success').length,
      totalCount: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error syncing calendars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
