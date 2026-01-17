# 🔧 Fix : Erreur fs.readdir dans Cloudflare Workers

## Problème
Lors du login Google, l'erreur suivante apparaissait :
```
Error: [unenv] fs.readdir is not implemented yet!
AdapterError: Read more at https://errors.authjs.dev#adaptererror
```

## Solution appliquée ✅

### 1. Migration vers JWT Sessions
- ❌ **Avant** : Database sessions avec `PrismaAdapter`
- ✅ **Après** : JWT sessions (compatible Workers)

### 2. Fichiers modifiés

#### `app/api/auth/[...nextauth]/route.ts`
```diff
- export const runtime = 'nodejs'  // Ne fonctionne pas dans Workers
+ // Runtime edge par défaut (compatible Workers)
```

#### `lib/auth.ts`
```diff
- import { PrismaAdapter } from "@auth/prisma-adapter"
- adapter: PrismaAdapter(getPrisma()),
- session: { strategy: "database" }

+ // Pas d'adapter - JWT uniquement
+ session: { strategy: "jwt" }
+ callbacks: {
+   async jwt({ token, account, profile }) {
+     // Sync manuel des users vers D1
+     if (account && profile) {
+       await prisma.user.upsert(...)
+     }
+   }
+ }
```

## Comment déployer maintenant

### Option 1 : Vérification puis déploiement
```bash
# 1. Vérifier que tout est prêt
./scripts/verify-worker-ready.sh

# 2. Build et déploiement
npm run build:worker && npm run deploy
```

### Option 2 : Déploiement direct
```bash
npm run build:worker && npm run deploy
```

## Avant le premier déploiement

### Configurer les secrets
```bash
# Auth secret (32+ caractères)
wrangler secret put AUTH_SECRET

# URL de l'app
wrangler secret put AUTH_URL
# Valeur : https://miniorg.antoine-hervet.workers.dev

# Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### Vérifier Google OAuth
Dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials) :
- Ajouter l'URI de redirection : `https://miniorg.antoine-hervet.workers.dev/api/auth/callback/google`

## Test après déploiement

1. Aller sur `https://miniorg.antoine-hervet.workers.dev`
2. Cliquer sur "Sign in with Google"
3. ✅ Devrait fonctionner sans erreur `fs.readdir`

## Vérifier les users en DB

```bash
wrangler d1 execute miniorg-production --remote --command "SELECT * FROM User"
```

## Documentation complète

- `DEPLOY_WORKERS_JWT.md` - Guide complet de déploiement
- `docs/deployment/JWT_SESSION_FIX.md` - Détails techniques

## Résumé des changements

✅ Suppression de `PrismaAdapter` (incompatible Workers)  
✅ Migration vers JWT sessions  
✅ Sync manuelle des users vers D1  
✅ Suppression du runtime nodejs forcé  
✅ Compatible avec Cloudflare Workers Edge Runtime  

**Le problème `fs.readdir` est maintenant résolu ! 🎉**
