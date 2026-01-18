/**
 * Client OAuth2 pour Google
 * Gère l'authentification et le refresh des tokens
 * Utilise fetch() au lieu de googleapis pour réduire la taille du bundle
 */
export class GoogleOAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Génère l'URL d'autorisation OAuth2
   */
  generateAuthUrl(params: {
    redirect_uri: string;
    scope: string[];
    state: string;
    access_type?: string;
    prompt?: string;
  }): string {
    const url = new URL(this.authUrl);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', params.redirect_uri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', params.scope.join(' '));
    url.searchParams.set('state', params.state);
    if (params.access_type) {
      url.searchParams.set('access_type', params.access_type);
    }
    if (params.prompt) {
      url.searchParams.set('prompt', params.prompt);
    }
    return url.toString();
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async getToken(params: {
    code: string;
    redirect_uri: string;
  }): Promise<GoogleTokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: params.code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: params.redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token exchange failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Rafraîchit le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    return response.json();
  }
}

/**
 * Type pour la réponse OAuth2 de Google
 */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}
