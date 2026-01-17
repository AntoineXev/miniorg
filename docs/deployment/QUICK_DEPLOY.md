# 🚀 Guide de Déploiement Rapide - Cloudflare Workers

## ⏱️ Temps estimé : 15-20 minutes

---

## ✅ Pré-requis

- [x] Migration NextAuth complète (vérifiée avec `./scripts/verify-nextauth-migration.sh`)
- [ ] Compte Cloudflare actif
- [ ] Wrangler CLI installé (`npm install -g wrangler`)
- [ ] Wrangler authentifié (`wrangler login`)
- [ ] Credentials Google OAuth prêts

---

## 📋 Étape 1 : Créer et Migrer D1 Database (5 min)

### 1.1 Créer la database D1

```bash
wrangler d1 create miniorg-production
```

**Output attendu:**
```
✅ Successfully created DB 'miniorg-production'!

[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "abcd1234-5678-90ef-ghij-klmnopqrstuv"
```

### 1.2 Mettre à jour wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "VOTRE-DATABASE-ID-ICI"  # Copier depuis le output ci-dessus
```

### 1.3 Appliquer les migrations Prisma

```bash
# D'abord, générer le SQL de migration si nécessaire
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/d1-migration.sql

# Créer un fichier de migration D1
mkdir -p migrations
cat prisma/d1-migration.sql > migrations/0001_initial.sql

# Appliquer la migration à D1
wrangler d1 execute miniorg-production --remote --file=migrations/0001_initial.sql
```

**Alternative : Utiliser les migrations existantes**
```bash
# Si vous avez déjà des migrations Prisma
wrangler d1 execute miniorg-production --remote --file=prisma/combined-migration.sql
```

**Vérifier la migration:**
```bash
wrangler d1 execute miniorg-production --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Vous devriez voir : `User`, `Account`, `Session`, `VerificationToken`, `Task`, `Tag`, `CalendarEvent`

---

## 🔐 Étape 2 : Configurer les Secrets (3 min)

### 2.1 Générer AUTH_SECRET

```bash
# Générer un secret sécurisé
openssl rand -base64 32
```

Copiez le résultat, vous en aurez besoin.

### 2.2 Configurer les secrets Cloudflare

```bash
# AUTH_SECRET (collez la valeur générée ci-dessus)
wrangler secret put AUTH_SECRET

# AUTH_URL (votre domaine Workers)
wrangler secret put AUTH_URL
# Valeur: https://miniorg.your-subdomain.workers.dev
# Ou si custom domain: https://app.your-domain.com

# GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_ID
# Valeur: votre client ID depuis Google Console

# GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
# Valeur: votre client secret depuis Google Console
```

**Vérifier les secrets:**
```bash
wrangler secret list
```

---

## 🔑 Étape 3 : Configurer Google OAuth (3 min)

### 3.1 Accéder à Google Cloud Console

1. Aller sur https://console.cloud.google.com/apis/credentials
2. Sélectionner votre projet (ou créer un nouveau)
3. Cliquer sur votre OAuth 2.0 Client ID (ou en créer un)

### 3.2 Ajouter les Redirect URIs

Dans **Authorized redirect URIs**, ajouter :

```
# Pour tester en local (optionnel)
http://localhost:3000/api/auth/callback/google

# Pour production (REQUIS)
https://miniorg.your-subdomain.workers.dev/api/auth/callback/google
```

> ⚠️ **Important :** L'URL doit correspondre exactement à votre AUTH_URL + `/api/auth/callback/google`

### 3.3 Copier les credentials

- Client ID → à utiliser pour `GOOGLE_CLIENT_ID`
- Client Secret → à utiliser pour `GOOGLE_CLIENT_SECRET`

---

## 🏗️ Étape 4 : Build et Deploy (4 min)

### 4.1 Build l'application

```bash
npm run build:worker
```

**Vérifications pendant le build:**
- ✅ Aucune erreur TypeScript
- ✅ Aucune erreur de routes ambiguës
- ✅ Aucune erreur NextAuth

### 4.2 Test en local (optionnel mais recommandé)

```bash
npm run preview
```

Ouvrir http://localhost:8771 et tester :
- Login avec Google
- Accès à /backlog
- Création de tâches
- Logout

### 4.3 Deploy en production

```bash
npm run deploy
```

**Output attendu:**
```
✨ Build complete
📦 Uploading...
✅ Successfully published your Worker
🌍 https://miniorg.your-subdomain.workers.dev
```

---

## ✅ Étape 5 : Vérifier le Déploiement (5 min)

### 5.1 Tests Manuels

Visiter : `https://miniorg.your-subdomain.workers.dev`

#### Test 1 : Page d'accueil / Redirect
- [ ] Accueil affiche correctement
- [ ] Redirect vers /login si non authentifié

#### Test 2 : Login Flow
- [ ] Cliquer sur "Continue with Google"
- [ ] Popup Google OAuth s'ouvre
- [ ] Choisir un compte Google
- [ ] Consent screen (si première fois)
- [ ] Redirection vers /backlog

#### Test 3 : Dashboard
- [ ] Sidebar affiche votre nom/email
- [ ] Navigation vers /calendar fonctionne
- [ ] Navigation vers /backlog fonctionne

#### Test 4 : Création de tâche
- [ ] Créer une nouvelle tâche
- [ ] Tâche apparaît dans la liste
- [ ] Drag & drop fonctionne (optionnel)

#### Test 5 : Persistence
- [ ] Rafraîchir la page
- [ ] Session toujours active
- [ ] Tâches toujours visibles

#### Test 6 : Logout
- [ ] Cliquer sur logout dans sidebar
- [ ] Redirection vers /login
- [ ] Accès à /backlog → redirect vers /login

### 5.2 Tests API (optionnel)

```bash
# Remplacer par votre URL
API_URL="https://miniorg.your-subdomain.workers.dev"

# Test unauthorized (devrait retourner 401)
curl -I $API_URL/api/tasks

# Test avec session (après login dans le browser)
# Copier le cookie de session depuis DevTools
curl -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  $API_URL/api/tasks
```

---

## 🔧 Troubleshooting

### Erreur : "Invalid redirect URI"

**Cause :** Google OAuth redirect URI mal configuré  
**Solution :**
1. Vérifier que l'URI dans Google Console correspond exactement
2. Format : `https://your-domain.workers.dev/api/auth/callback/google`
3. Pas de trailing slash `/`

### Erreur : "D1 database binding not found"

**Cause :** Binding DB non configuré dans wrangler.toml  
**Solution :**
```toml
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "votre-database-id"
```

### Erreur : "AUTH_SECRET not set"

**Cause :** Secret non configuré dans Cloudflare  
**Solution :**
```bash
wrangler secret put AUTH_SECRET
# Générer avec: openssl rand -base64 32
```

### Session ne persiste pas

**Cause :** AUTH_URL incorrect ou cookies bloqués  
**Solution :**
1. Vérifier `AUTH_URL` : `wrangler secret list`
2. Vérifier que le domaine correspond exactement
3. Tester en navigation privée (cache/cookies)

### Pages se rechargent en boucle

**Cause :** Middleware mal configuré ou session invalide  
**Solution :**
1. Check les logs : `wrangler tail`
2. Vérifier middleware.ts ne crée pas de redirect loop
3. Clear cookies et re-login

---

## 📊 Monitoring

### Voir les logs en temps réel

```bash
wrangler tail
```

### Voir les métriques dans le dashboard

1. Aller sur https://dash.cloudflare.com
2. Workers & Pages > miniorg
3. Onglet "Metrics"

Métriques importantes :
- **Requests** - Nombre de requêtes
- **Errors** - Taux d'erreur (devrait être < 1%)
- **CPU Time** - Utilisation CPU
- **Duration** - Latence (devrait être < 200ms)

---

## 🎉 Déploiement Réussi !

Si tous les tests passent, votre application est déployée avec succès ! 🚀

### Prochaines étapes (optionnel)

- [ ] Configurer un custom domain
- [ ] Activer Cloudflare Analytics
- [ ] Configurer des alertes monitoring
- [ ] Activer la synchronisation Google Calendar
- [ ] Ajouter d'autres providers OAuth (GitHub, etc.)

---

## 🆘 Support

### Docs
- NextAuth : https://authjs.dev/getting-started/installation
- Cloudflare Workers : https://developers.cloudflare.com/workers/
- Wrangler : https://developers.cloudflare.com/workers/wrangler/

### Vérification Configuration
```bash
./scripts/verify-nextauth-migration.sh
```

### Logs détaillés
```bash
# Production logs
wrangler tail --format=pretty

# Avec filters
wrangler tail --status=error
wrangler tail --method=POST
```

---

**Dernière mise à jour :** 17 janvier 2026  
**Version :** 1.0 - NextAuth v5 Migration Complete
