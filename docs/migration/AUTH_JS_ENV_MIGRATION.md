# Migration vers Auth.js - Variables d'environnement

## Changements nécessaires

La migration de Better Auth vers Auth.js (NextAuth v5) nécessite de mettre à jour vos variables d'environnement.

### Variables renommées

| Avant (Better Auth) | Après (Auth.js) |
|---------------------|-----------------|
| `BETTER_AUTH_SECRET` | `AUTH_SECRET` ou `NEXTAUTH_SECRET` |
| `BETTER_AUTH_URL` | `AUTH_URL` ou `NEXTAUTH_URL` |

Les autres variables restent identiques :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`

## Configuration locale

Mettez à jour votre fichier `.env` :

```bash
# Ancien
BETTER_AUTH_SECRET="votre-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Nouveau
AUTH_SECRET="votre-secret"
AUTH_URL="http://localhost:3000"

# Ou utilisez les noms NextAuth (aussi supportés)
NEXTAUTH_SECRET="votre-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Configuration Cloudflare Workers

### Mettre à jour les secrets

```bash
# Supprimer les anciens secrets (si configurés)
wrangler secret delete BETTER_AUTH_SECRET
wrangler secret delete BETTER_AUTH_URL

# Ajouter les nouveaux secrets
wrangler secret put AUTH_SECRET
# Ou : wrangler secret put NEXTAUTH_SECRET

wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

**Note** : `AUTH_URL` / `NEXTAUTH_URL` n'est généralement pas nécessaire en production car Auth.js le détecte automatiquement. Mais si vous devez le définir :

```bash
# Via wrangler.toml dans [vars] (pas secret, c'est public)
[vars]
AUTH_URL = "https://votre-worker.workers.dev"
```

### Via le Dashboard Cloudflare

1. Allez sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages > votre worker > Settings > Variables
3. Cliquez "Add variable"
4. Ajoutez :
   - `AUTH_SECRET` (cochez "Encrypt")
   - `GOOGLE_CLIENT_ID` (cochez "Encrypt")
   - `GOOGLE_CLIENT_SECRET` (cochez "Encrypt")

## Vérification

Après mise à jour, vérifiez que tout fonctionne :

```bash
# Local
npm run dev

# Production (après déploiement)
wrangler secret list
```

## Migration D1

La migration Prisma a déjà créé la table `Session` nécessaire pour Auth.js. Pour l'appliquer sur D1 :

```bash
wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
```

## Callback URLs Google OAuth

Assurez-vous de mettre à jour les Authorized redirect URIs dans Google Cloud Console :

**Ancien** : `https://votre-domaine.com/api/auth/[...all]`
**Nouveau** : `https://votre-domaine.com/api/auth/callback/google`

La route exacte sera :
- Local : `http://localhost:3000/api/auth/callback/google`
- Production : `https://votre-domaine.workers.dev/api/auth/callback/google`
