import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarAdapter } from '@/lib/calendar/google';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/auth/google-calendar/callback - Callback OAuth Google Calendar
export async function GET(request: NextRequest) {
  // For static export (Tauri), API routes are not supported
  if (process.env.BUILD_TARGET === 'tauri') {
    return NextResponse.json({ error: 'API routes not available in static export' }, { status: 501 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings/calendars?error=${encodeURIComponent('Authentication failed')}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/calendars?error=missing_parameters', request.url)
      );
    }

    // Décoder et vérifier le state (contient le userId encodé lors de l'initiation)
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return NextResponse.redirect(
        new URL('/settings/calendars?error=invalid_state', request.url)
      );
    }

    // Vérifier que le userId existe dans le state et que l'utilisateur existe
    if (!stateData.userId) {
      return NextResponse.redirect(
        new URL('/settings/calendars?error=invalid_state', request.url)
      );
    }

    const user = await prisma.user.findUnique({ where: { id: stateData.userId } });
    if (!user) {
      return NextResponse.redirect(
        new URL('/settings/calendars?error=user_not_found', request.url)
      );
    }

    const userId = stateData.userId;

    const adapter = new GoogleCalendarAdapter();
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    const redirectUri =
      process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
      `${baseUrl}/api/auth/google-calendar/callback`;

    // Échanger le code contre des tokens
    const tokens = await adapter.exchangeCodeForTokens(code, redirectUri);

    // Récupérer la liste des calendriers de l'utilisateur
    const calendars = await adapter.listCalendars(tokens.accessToken);

    // Sauvegarder TOUS les calendriers dans la DB avec isActive=false par défaut
    let savedCount = 0;
    for (const calendar of calendars) {
      try {
        // Vérifier si le calendrier existe déjà
        const existingConnection = await prisma.calendarConnection.findFirst({
          where: {
            userId: userId,
            provider: 'google',
            calendarId: calendar.id,
          },
        });

        if (existingConnection) {
          // Mettre à jour les tokens si le calendrier existe déjà
          await prisma.calendarConnection.update({
            where: { id: existingConnection.id },
            data: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
            },
          });
        } else {
          // Créer une nouvelle connexion avec isActive=false et isExportTarget=false
          await prisma.calendarConnection.create({
            data: {
              userId: userId,
              provider: 'google',
              providerAccountId: calendar.id,
              name: calendar.name,
              calendarId: calendar.id,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
              isActive: false,
              isExportTarget: false,
            },
          });
          savedCount++;
        }
      } catch (error) {
        console.error(`Error saving calendar ${calendar.name}:`, error);
      }
    }

    // Rediriger vers la page settings/calendars avec le flag onboarding=true pour déclencher le modal
    // Si la requête venait de Tauri, utiliser le deep link pour rouvrir l'app
    if (stateData.source === 'tauri') {
      return NextResponse.redirect('miniorg://settings/calendars?onboarding=true');
    }

    return NextResponse.redirect(
      new URL('/settings/calendars?onboarding=true', request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    // Pour les erreurs, on redirige vers le web (pas de deep link car on ne connaît pas la source)
    return NextResponse.redirect(
      new URL('/settings/calendars?error=authentication_failed', request.url)
    );
  }
}
