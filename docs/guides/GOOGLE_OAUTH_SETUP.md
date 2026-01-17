# Configuration Google OAuth pour Cloudflare

Ce document explique comment configurer Google OAuth pour fonctionner avec votre déploiement Cloudflare.

## Étapes de configuration

### 1. Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez ou créez un projet

### 2. Activer l'API Google+

1. Dans le menu, allez dans **APIs & Services** > **Library**
2. Recherchez "Google+ API" ou "Google People API"
3. Cliquez sur **Enable**

### 3. Créer les credentials OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Si demandé, configurez l'écran de consentement OAuth :
   - User Type: **External**
   - App name: **MiniOrg**
   - User support email: votre email
   - Developer contact: votre email
   - Scopes: ajoutez `userinfo.email` et `userinfo.profile`
   - Test users: ajoutez votre email (mode développement)

### 4. Configurer l'OAuth Client ID

#### Type d'application
Sélectionnez **Web application**

#### Nom
`MiniOrg - Production`

#### Authorized JavaScript origins

Ajoutez :
```
https://miniorg.pages.dev
```

Si vous avez un domaine custom :
```
https://votre-domaine.com
```

#### Authorized redirect URIs

**IMPORTANT**: Ajoutez les deux URIs suivantes :

Pour le développement local :
```
http://localhost:3000/api/auth/callback/google
```

Pour la production Cloudflare :
```
https://miniorg.pages.dev/api/auth/callback/google
```

Si vous avez un domaine custom :
```
https://votre-domaine.com/api/auth/callback/google
```

### 5. Récupérer les credentials

Après la création, vous verrez :
- **Client ID** : ressemble à `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret** : ressemble à `GOCSPX-abc123def456`

**Copiez ces valeurs !**

### 6. Configurer les secrets Cloudflare

Une fois votre app déployée, configurez les secrets :

```bash
# Client ID
wrangler secret put GOOGLE_CLIENT_ID
# Collez votre Client ID quand demandé

# Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Collez votre Client Secret quand demandé
```

### 7. Vérifier la configuration

Après déploiement :

1. Visitez `https://miniorg.pages.dev` (ou votre domaine)
2. Cliquez sur "Sign in with Google"
3. Vous devriez voir l'écran de consentement Google
4. Après autorisation, vous devriez être redirigé vers l'application

## Dépannage

### Erreur "redirect_uri_mismatch"

**Problème**: L'URI de redirection ne correspond pas.

**Solution**:
1. Vérifiez que l'URI dans Google Console correspond EXACTEMENT à votre URL de déploiement
2. Format attendu : `https://VOTRE-URL.pages.dev/api/auth/callback/google`
3. Pas d'espace, pas de trailing slash
4. HTTPS obligatoire en production

### Erreur "invalid_client"

**Problème**: Client ID ou Secret incorrect.

**Solution**:
1. Vérifiez que vous avez bien copié le Client ID et Secret
2. Reconfigurez les secrets :
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

### Erreur "access_denied"

**Problème**: L'utilisateur n'est pas autorisé.

**Solution**:
1. Si en mode "Testing", ajoutez l'email de l'utilisateur dans "Test users"
2. Ou publiez l'application (passer en "Production" dans l'écran de consentement)

### L'authentification fonctionne en local mais pas en production

**Vérifiez**:
1. Que `NEXTAUTH_URL` est bien configuré avec l'URL de production :
   ```bash
   wrangler secret put NEXTAUTH_URL
   # Entrez: https://miniorg.pages.dev
   ```
2. Que `NEXTAUTH_SECRET` est bien configuré :
   ```bash
   wrangler secret put NEXTAUTH_SECRET
   # Entrez une longue chaîne aléatoire
   ```

## URLs importantes

### Développement local
- Application : `http://localhost:3000`
- Callback : `http://localhost:3000/api/auth/callback/google`

### Production Cloudflare Pages
- Application : `https://miniorg.pages.dev`
- Callback : `https://miniorg.pages.dev/api/auth/callback/google`

### Avec domaine custom
- Application : `https://votre-domaine.com`
- Callback : `https://votre-domaine.com/api/auth/callback/google`

## Note sur les domaines custom

Si vous configurez un domaine custom dans Cloudflare :

1. Ajoutez le domaine dans Cloudflare Pages settings
2. Ajoutez les URIs avec ce domaine dans Google Console
3. Mettez à jour `NEXTAUTH_URL` :
   ```bash
   wrangler secret put NEXTAUTH_URL
   # Entrez: https://votre-domaine.com
   ```

## Sécurité

- ⚠️ Ne commitez JAMAIS les credentials dans Git
- ⚠️ Les secrets doivent être configurés via Wrangler, pas dans le code
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Utilisez `.env.example` comme template

## Ressources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Cloudflare Secrets Management](https://developers.cloudflare.com/workers/configuration/secrets/)
