# ✅ Déploiement Workers avec JWT Sessions

## Problème résolu : fs.readdir dans Cloudflare Workers

### Erreur rencontrée
```
Error: [unenv] fs.readdir is not implemented yet!
AdapterError: Read more at https://errors.authjs.dev#adaptererror
```

### Cause
- `@auth/prisma-adapter` utilise `fs.readdir` pour lire le schéma Prisma
- Cloudflare Workers ne supporte pas le système de fichiers (`fs`)
- Le runtime Node.js n'est pas disponible dans Workers

### Solution appliquée ✅
**Migration vers JWT sessions** au lieu de database sessions :

1. ✅ Suppression de `runtime = 'nodejs'` dans le route handler
2. ✅ Remplacement de `PrismaAdapter` par JWT strategy
3. ✅ Synchronisation manuelle des users vers D1 dans le callback JWT
4. ✅ Compatible avec Cloudflare Workers Edge Runtime

## 🚀 Commandes de déploiement

```bash
# 1. Build pour Workers
npm run build:worker

# 2. Déployer
npm run deploy

# Ou en une ligne
npm run build:worker && npm run deploy
```

## 📋 Checklist de vérification

### Code
- ✅ `app/api/auth/[...nextauth]/route.ts` - Suppression runtime nodejs
- ✅ `lib/auth.ts` - Migration vers JWT sessions
- ✅ `lib/auth.ts` - Sync manuelle des users vers D1
- ✅ Compatible Edge Runtime

### Variables d'environnement (Secrets Workers)

Vérifiez que tous les secrets sont configurés :

```bash
# Lister les secrets actuels
wrangler secret list

# Ajouter les secrets manquants
wrangler secret put AUTH_SECRET
wrangler secret put AUTH_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Valeurs attendues :
- `AUTH_SECRET` : String aléatoire de 32+ caractères
- `AUTH_URL` : `https://miniorg.antoine-hervet.workers.dev`
- `GOOGLE_CLIENT_ID` : Depuis Google Cloud Console
- `GOOGLE_CLIENT_SECRET` : Depuis Google Cloud Console

### Database D1

```bash
# Vérifier que la DB existe
wrangler d1 list

# Vérifier la configuration dans wrangler.toml
# binding = "DB"
# database_name = "miniorg-production"
# database_id = "4bc4d83f-391b-45bb-af6a-51310ecfc020"
```

### Google OAuth

1. Aller dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Vérifier que l'URI de redirection est configurée :
   ```
   https://miniorg.antoine-hervet.workers.dev/api/auth/callback/google
   ```

## 🎯 Après le déploiement

### Test du login

1. Aller sur `https://miniorg.antoine-hervet.workers.dev`
2. Cliquer sur "Sign in with Google"
3. Se connecter avec votre compte Google
4. ✅ Devrait fonctionner sans erreur `fs.readdir`

### Vérifier les logs

```bash
# Voir les logs en temps réel
wrangler tail

# Logs dans le dashboard Cloudflare
# https://dash.cloudflare.com → Workers & Pages → miniorg → Logs
```

### Vérifier la DB

```bash
# Se connecter à D1
wrangler d1 execute miniorg-production --remote --command "SELECT * FROM User"

# Vérifier qu'un user a été créé après login
```

## 📊 Différences JWT vs Database Sessions

### JWT Sessions (Solution actuelle) ✅

**Avantages** :
- ✅ Compatible Cloudflare Workers
- ✅ Pas de requête DB à chaque requête
- ✅ Performant et scalable
- ✅ Stateless

**Limitations** :
- ⚠️ Pas de révocation instantanée des sessions
- ⚠️ Token limité à ~4KB
- ⚠️ Sync manuelle des users vers DB

### Database Sessions (Avant)

**Avantages** :
- ✅ Révocation instantanée
- ✅ Sync automatique des users
- ✅ Gestion complète des comptes/sessions

**Problèmes** :
- ❌ Ne fonctionne pas dans Workers (fs.readdir)
- ❌ Requête DB à chaque requête
- ❌ Nécessite PrismaAdapter

## 🔧 Troubleshooting

### Erreur : "Invalid AUTH_SECRET"
```bash
# Régénérer un secret
openssl rand -base64 32
wrangler secret put AUTH_SECRET
# Coller le secret
```

### Erreur : "Database binding not found"
Vérifier `wrangler.toml` :
```toml
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "4bc4d83f-391b-45bb-af6a-51310ecfc020"
```

### Erreur : "Redirect URI mismatch"
Ajouter dans Google Cloud Console :
```
https://miniorg.antoine-hervet.workers.dev/api/auth/callback/google
```

### Users ne sont pas sauvegardés en DB
Vérifier les logs :
```bash
wrangler tail
# Chercher : "Failed to sync user to database"
```

Si erreur Prisma, vérifier que les migrations sont appliquées :
```bash
wrangler d1 execute miniorg-production --remote --file=prisma/d1-schema.sql
```

## 📚 Documentation

- `docs/deployment/JWT_SESSION_FIX.md` - Détails techniques de la solution
- `docs/deployment/CLOUDFLARE_ASYNC_HOOKS_ISSUE.md` - Problèmes précédents
- `docs/guides/GOOGLE_OAUTH_SETUP.md` - Configuration OAuth

## ✨ C'est prêt !

Vous pouvez maintenant déployer sans erreur `fs.readdir` :

```bash
npm run build:worker && npm run deploy
```

**Bon déploiement ! 🎉**
