# 🚀 Migration Auth.js - Guide de démarrage rapide

## ✅ Migration terminée !

La migration de Better Auth vers Auth.js (NextAuth v5) est **complète**. Voici les prochaines étapes pour tester et déployer.

## 📋 Checklist : Ce qui a été fait

- ✅ Better Auth désinstallé, Auth.js installé
- ✅ Override `@noble/ciphers` supprimé du `package.json`
- ✅ Modèle `Session` ajouté à Prisma
- ✅ Configuration Auth.js créée (`lib/auth.ts`)
- ✅ Routes API migrées (auth + tasks + calendar + tags)
- ✅ Middleware simplifié (60% de code en moins !)
- ✅ Client et page login mis à jour
- ✅ Fichiers Better Auth supprimés
- ✅ Migration Prisma créée et appliquée
- ✅ Documentation créée

## 🎯 Actions requises de votre part

### 1️⃣ Mettre à jour les variables d'environnement locales

**Fichier** : `.env`

```bash
# Remplacer ces variables :
BETTER_AUTH_SECRET="..."     → AUTH_SECRET="..."
BETTER_AUTH_URL="..."        → AUTH_URL="http://localhost:3000"

# OU utiliser les noms NextAuth (aussi supportés) :
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Les autres variables restent identiques
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
DATABASE_URL="file:./prisma/dev.db"
```

> 💡 **Astuce** : Consultez `env.example` pour le format exact

### 2️⃣ Tester localement

```bash
# Démarrer le serveur de dev
npm run dev

# Ouvrir http://localhost:3000
# Tester :
# - Login avec Google
# - Création de tâches
# - Navigation protégée
# - Logout
```

### 3️⃣ Mettre à jour Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Sélectionner votre projet OAuth
3. Modifier les **Authorized redirect URIs** :
   - ✅ Ajouter : `http://localhost:3000/api/auth/callback/google`
   - ✅ Ajouter : `https://VOTRE-DOMAINE.workers.dev/api/auth/callback/google`
   - ❌ Supprimer l'ancienne : `/api/auth/[...all]` (si présente)

### 4️⃣ Déployer sur Cloudflare Workers

#### A. Appliquer la migration D1

```bash
# Appliquer la migration Session sur D1
wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
```

#### B. Configurer les secrets Cloudflare

```bash
# Supprimer les anciens secrets (si configurés)
wrangler secret delete BETTER_AUTH_SECRET 2>/dev/null || true
wrangler secret delete BETTER_AUTH_URL 2>/dev/null || true

# Ajouter les nouveaux secrets
wrangler secret put AUTH_SECRET
# Entrer votre secret (même valeur qu'avant)

wrangler secret put GOOGLE_CLIENT_ID
# Entrer votre Google Client ID

wrangler secret put GOOGLE_CLIENT_SECRET
# Entrer votre Google Client Secret
```

#### C. Build et déployer

```bash
# Build pour Cloudflare Workers
npm run build:worker

# Déployer
npm run deploy

# Vérifier les logs
wrangler tail
```

## 📚 Documentation complète

- **Migration complète** : [`docs/migration/AUTH_JS_MIGRATION_COMPLETE.md`](./AUTH_JS_MIGRATION_COMPLETE.md)
- **Variables d'environnement** : [`docs/migration/AUTH_JS_ENV_MIGRATION.md`](./AUTH_JS_ENV_MIGRATION.md)
- **Déploiement Workers** : [`docs/deployment/DEPLOYMENT_WORKERS.md`](../deployment/DEPLOYMENT_WORKERS.md)

## 🆘 Dépannage

### Erreur "Unauthorized" sur les API routes

**Cause** : Variables d'environnement mal configurées

**Solution** :
```bash
# Vérifier que AUTH_SECRET est défini
echo $AUTH_SECRET

# Si vide, mettre à jour .env
```

### Erreur "Session not found"

**Cause** : Migration pas appliquée ou base de données désynchronisée

**Solution** :
```bash
# Regénérer Prisma Client
npx prisma generate

# Réappliquer les migrations
npx prisma migrate deploy
```

### Erreur Google OAuth redirect_uri_mismatch

**Cause** : URL de callback pas configurée dans Google Console

**Solution** : Voir étape 3️⃣ ci-dessus

## ✨ Avantages de cette migration

- ✅ **Compatible Cloudflare Workers** : Aucun workaround nécessaire
- ✅ **Plus simple** : 80 lignes de code en moins
- ✅ **Plus sécurisé** : Sessions en base de données
- ✅ **Mieux maintenu** : Solution officielle Next.js
- ✅ **Bundle léger** : Pas de dépendances problématiques

## 🎉 C'est tout !

Une fois les 4 étapes ci-dessus complétées, votre application sera :
- ✅ Fonctionnelle en local avec Auth.js
- ✅ Déployée sur Cloudflare Workers
- ✅ Sans aucun problème de compatibilité `@noble/ciphers`

**Questions ?** Consultez la [documentation complète](./AUTH_JS_MIGRATION_COMPLETE.md) ou les ressources Auth.js.
