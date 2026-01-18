import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleCalendarAdapter } from '@/lib/calendar/google';

// GET /api/auth/google-calendar - Initier l'authentification OAuth Google Calendar
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/settings';

    // Créer un state unique pour la sécurité OAuth
    const state = crypto.randomUUID();

    // Sauvegarder le state en session (pour vérification au callback)
    // Note: Dans une vraie app, il faudrait sauvegarder cela dans une session côté serveur
    // Pour simplifier, on va l'encoder dans le state avec le userId
    const stateData = {
      userId: session.user.id,
      nonce: state,
      callbackUrl,
    };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');

    const adapter = new GoogleCalendarAdapter();
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    const redirectUri =
      process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
      `${baseUrl}/api/auth/google-calendar/callback`;

    const authUrl = adapter.getAuthUrl(redirectUri, encodedState);

    // Rediriger vers l'URL d'authentification Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google Calendar auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}
