# Configuration Cloudflare Pages via Dashboard

Si vous déployez via le Dashboard Cloudflare (au lieu de Wrangler CLI), suivez ces étapes :

## Build Settings

1. Allez sur **Cloudflare Dashboard** > **Pages** > **Create a project**
2. Connectez votre repo GitHub
3. Configurez :

### Framework preset
- **Framework preset** : Next.js

### Build settings
- **Build command** : `npm install --legacy-peer-deps && npm run pages:build`
- **Build output directory** : `.vercel/output/static`
- **Root directory** : `/` (racine du projet)

**Note importante** : On utilise `npm install --legacy-peer-deps` au lieu de `npm ci` car nous avons des dépendances avec des peer dependencies conflictuelles (@cloudflare/next-on-pages avec Next.js 14).

### Environment variables (Build)

Ajoutez ces variables pour le build :

```
NODE_ENV=production
```

## Environment Variables (Runtime)

⚠️ **Important** : Ces variables doivent être configurées dans l'interface Cloudflare Pages, pas via wrangler secrets.

Allez dans **Settings** > **Environment variables** et ajoutez :

### Production

| Variable | Value | Type |
|----------|-------|------|
| `NEXTAUTH_SECRET` | `votre-secret-aleatoire-long` | Encrypted |
| `NEXTAUTH_URL` | `https://miniorg.pages.dev` | Text |
| `GOOGLE_CLIENT_ID` | `votre-client-id.apps.googleusercontent.com` | Encrypted |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | Encrypted |

### Preview (optional)

Mêmes variables mais avec `NEXTAUTH_URL=https://PREVIEW-URL.pages.dev`

## D1 Database Binding

1. Créez votre base D1 via CLI ou Dashboard
2. Dans **Settings** > **Functions** > **D1 database bindings** :
   - **Variable name** : `DB`
   - **D1 database** : Sélectionnez `miniorg-production`

## Custom Domain (optional)

1. **Settings** > **Custom domains**
2. Ajoutez votre domaine
3. Cloudflare configurera automatiquement le DNS
4. ⚠️ N'oubliez pas de mettre à jour `NEXTAUTH_URL` et Google OAuth redirect URIs

## Déploiement via Git

Une fois configuré :

1. Push sur votre branche `main`
2. Cloudflare build et déploie automatiquement
3. Chaque PR crée un preview deployment

## Alternative : Déploiement via CLI

Si vous préférez la ligne de commande :

```bash
# Build
npm run pages:build

# Deploy
wrangler pages deploy .vercel/output/static --project-name=miniorg

# Configurer les secrets
wrangler secret put NEXTAUTH_SECRET --env production
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put NEXTAUTH_URL --env production
```

## Vérification

Après le déploiement :

1. Visitez votre URL `https://miniorg.pages.dev`
2. Testez la connexion Google
3. Vérifiez les logs : **Functions** > **Real-time logs**

## Troubleshooting

### Build échoue

- Vérifiez que `NODE_ENV=production` est bien configuré
- Vérifiez les logs de build dans l'interface
- Testez localement : `npm run pages:build`

### Runtime errors

- Vérifiez que le binding D1 `DB` est bien configuré
- Vérifiez que toutes les variables d'environnement sont présentes
- Consultez les logs en temps réel

### OAuth ne fonctionne pas

- Vérifiez `NEXTAUTH_URL` correspond à l'URL réelle
- Vérifiez les redirect URIs dans Google Console
- Vérifiez que `NEXTAUTH_SECRET` est bien défini
