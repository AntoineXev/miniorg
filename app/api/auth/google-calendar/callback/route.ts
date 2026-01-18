import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleCalendarAdapter } from '@/lib/calendar/google';

// GET /api/auth/google-calendar/callback - Callback OAuth Google Calendar
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent('Authentication failed')}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=missing_parameters', request.url)
      );
    }

    // Décoder et vérifier le state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      );
    }

    if (stateData.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL('/settings?error=user_mismatch', request.url)
      );
    }

    const adapter = new GoogleCalendarAdapter();
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    const redirectUri =
      process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
      `${baseUrl}/api/auth/google-calendar/callback`;

    // Échanger le code contre des tokens
    const tokens = await adapter.exchangeCodeForTokens(code, redirectUri);

    // Récupérer la liste des calendriers de l'utilisateur
    const calendars = await adapter.listCalendars(tokens.accessToken);

    // Encoder les données pour les passer à la page de sélection
    const dataToEncode = {
      tokens,
      calendars,
    };
    const encodedData = Buffer.from(JSON.stringify(dataToEncode)).toString('base64');

    // Rediriger vers une page de sélection de calendriers avec les données
    const callbackUrl = stateData.callbackUrl || '/settings';
    return NextResponse.redirect(
      new URL(`${callbackUrl}?calendar_data=${encodedData}`, request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=authentication_failed', request.url)
    );
  }
}
