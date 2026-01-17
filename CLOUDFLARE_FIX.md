# Fix pour l'erreur async_hooks sur Cloudflare

## Changements effectués

### 1. Nouveau fichier: `lib/auth-edge.ts`
Un wrapper d'authentification compatible avec Edge Runtime qui utilise `getToken` au lieu de `auth()` pour éviter la dépendance `async_hooks`.

### 2. Mise à jour de toutes les routes API
- `app/api/tasks/route.ts`
- `app/api/calendar-events/route.ts`
- `app/api/tags/route.ts`

Remplacement de `auth()` par `getServerSession(request)` pour éviter l'utilisation d'`async_hooks`.

### 3. Configuration Edge Runtime
Tous les fichiers de routes API spécifient maintenant explicitement `export const runtime = 'edge'`.

### 4. Mise à jour de Next.js
Mise à jour vers Next.js 16+ et React 19+ pour une meilleure compatibilité avec Cloudflare.

### 5. Ajout de dépendances
- `@cloudflare/next-on-pages` - pour construire le projet pour Cloudflare Pages
- `wrangler` - CLI Cloudflare
- `vercel` - nécessaire pour le build

### 6. Ajout de `.npmrc`
Fichier avec `legacy-peer-deps=true` pour gérer les conflits de dépendances.

### 7. Script de build optimisé
Nouveau script `build:pages` dans `package.json` (attendu par Cloudflare):
```bash
npm run build:pages
```

Alias `build:cloudflare` disponible également:
```bash
npm run build:cloudflare
```

## Déploiement

### 1. Construire localement (optionnel)
```bash
npm run build:pages
# ou
npm run build:cloudflare
```

### 2. Déployer sur Cloudflare Pages

#### Via le dashboard Cloudflare:
1. Allez dans Pages > Créer un projet
2. Connectez votre repo Git
3. Configurez les paramètres:
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`
4. Ajoutez les variables d'environnement:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `DATABASE_URL` (pour D1)
5. Liez votre base de données D1

#### Via Wrangler:
```bash
npm run pages:deploy
```

## Vérification

Le problème d'origine était:
```
Error: No such module "__next-on-pages-dist__/functions/async_hooks"
```

Ce problème est maintenant résolu car:
1. Nous n'utilisons plus `auth()` qui dépend d'`async_hooks`
2. Nous utilisons `getToken` de NextAuth qui est compatible avec Edge Runtime
3. Toutes les routes API sont configurées pour utiliser Edge Runtime
4. Le middleware utilise également `getToken` au lieu de `auth()`

## Notes importantes

- **NextAuth v5**: Compatible avec Edge Runtime via `getToken`
- **Prisma**: Utilisez `@prisma/adapter-d1` pour D1 (déjà configuré)
- **Middleware**: Fonctionne automatiquement en Edge Runtime dans Next.js 16
- **Build warnings**: Les avertissements sur la dépréciation du middleware sont normaux dans Next.js 16

## Résolution des problèmes

Si vous rencontrez toujours des erreurs:

1. **Vérifiez les variables d'environnement** sur Cloudflare
2. **Vérifiez que D1 est bien lié** au projet
3. **Consultez les logs** dans le dashboard Cloudflare Pages
4. **Testez localement** avec `npm run pages:dev`
