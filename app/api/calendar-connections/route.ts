import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthorizedUser } from '@/lib/auth-tauri-server';

// Schema pour la création/mise à jour de connexion
const connectionSchema = z.object({
  provider: z.enum(['google', 'outlook', 'apple']),
  providerAccountId: z.string(),
  name: z.string(),
  calendarId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
  isExportTarget: z.boolean().optional(),
});

// GET /api/calendar-connections - Liste des connexions de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.calendarConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching calendar connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/calendar-connections - Créer une connexion
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const body = connectionSchema.parse(json);

    // Vérifier si une connexion similaire existe déjà
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId,
        provider: body.provider,
        calendarId: body.calendarId,
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Calendar connection already exists' },
        { status: 400 }
      );
    }

    // Si c'est la première connexion, la définir comme export target par défaut
    const isFirstConnection = (await prisma.calendarConnection.count({
      where: { userId },
    })) === 0;

    const connection = await prisma.calendarConnection.create({
      data: {
        userId,
        provider: body.provider,
        providerAccountId: body.providerAccountId,
        name: body.name,
        calendarId: body.calendarId,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        isActive: true,
        isExportTarget: isFirstConnection,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating calendar connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/calendar-connections - Modifier une connexion
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const body = updateSchema.parse(json);

    // Vérifier que la connexion appartient à l'utilisateur
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        id: body.id,
        userId,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Si on définit cette connexion comme export target, désactiver les autres
    if (body.isExportTarget === true) {
      await prisma.calendarConnection.updateMany({
        where: {
          userId,
          id: { not: body.id },
        },
        data: {
          isExportTarget: false,
        },
      });
      updateData.isExportTarget = true;
    } else if (body.isExportTarget === false) {
      updateData.isExportTarget = false;
    }

    const updatedConnection = await prisma.calendarConnection.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json(updatedConnection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating calendar connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar-connections - Supprimer une connexion
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthorizedUser(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    // Vérifier que la connexion appartient à l'utilisateur
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Supprimer la connexion (et tous les événements associés via cascade)
    await prisma.calendarConnection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
