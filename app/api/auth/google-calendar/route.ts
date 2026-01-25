import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-tauri-server';
import { GoogleCalendarAdapter } from '@/lib/calendar/google';

export const dynamic = 'force-dynamic';

// GET /api/auth/google-calendar - Initier l'authentification OAuth Google Calendar
export async function GET(request: NextRequest) {
  // For static export (Tauri), API routes are not supported
  if (process.env.BUILD_TARGET === 'tauri') {
    return NextResponse.json({ error: 'API routes not available in static export' }, { status: 501 });
  }

  try {
    const authResult = await getAuthorizedUser(request);
    if (!authResult?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/settings/calendars';

    // Créer un state unique pour la sécurité OAuth
    const state = crypto.randomUUID();

    // Sauvegarder le state en session (pour vérification au callback)
    // Note: Dans une vraie app, il faudrait sauvegarder cela dans une session côté serveur
    // Pour simplifier, on va l'encoder dans le state avec le userId
    const stateData = {
      userId: authResult.userId,
      nonce: state,
      callbackUrl,
      source: authResult.source, // 'tauri' ou 'web'
    };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');

    const adapter = new GoogleCalendarAdapter();
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    const redirectUri =
      process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
      `${baseUrl}/api/auth/google-calendar/callback`;

    const authUrl = adapter.getAuthUrl(redirectUri, encodedState);

    // Si c'est une requête Tauri (a un Authorization header), retourner l'URL en JSON
    // pour que le client puisse l'ouvrir dans le navigateur externe
    if (authResult.source === 'tauri') {
      return NextResponse.json({ authUrl });
    }

    // Sinon, rediriger directement vers l'URL d'authentification Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google Calendar auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}
