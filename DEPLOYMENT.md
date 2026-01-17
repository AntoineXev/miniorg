# Guide de déploiement sur Cloudflare Pages + D1

Ce guide vous accompagne pas à pas pour déployer MiniOrg sur Cloudflare.

## Prérequis

- Compte Cloudflare (gratuit)
- Node.js 18+
- Wrangler CLI installé

## Étape 1: Configuration initiale

### 1.1 Installer Wrangler CLI (si pas déjà fait)

```bash
npm install -g wrangler
```

### 1.2 Se connecter à Cloudflare

```bash
wrangler login
```

Cela ouvrira votre navigateur pour authentification.

## Étape 2: Créer la base de données D1

```bash
wrangler d1 create miniorg-production
```

Cette commande affichera quelque chose comme :

```
✅ Successfully created DB 'miniorg-production'!

[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copiez le `database_id` et mettez-le à jour dans `wrangler.toml`.

### 2.1 Vérifier la configuration wrangler.toml

Assurez-vous que votre `wrangler.toml` contient bien :

```toml
name = "miniorg"
compatibility_date = "2024-01-17"
pages_build_output_dir = ".vercel/output/static"

# Compatibility flags for Node.js APIs (IMPORTANT!)
compatibility_flags = ["nodejs_compat"]

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "votre-database-id-ici"
```

⚠️ **Le flag `nodejs_compat` est essentiel** - sans lui, vous aurez l'erreur `Node.JS Compatibility Error` au runtime.

## Étape 3: Migrer le schéma de base de données

Exécutez le script de migration :

```bash
./scripts/migrate-to-d1.sh miniorg-production
```

Ou manuellement :

```bash
# Combiner les migrations
cat prisma/migrations/*/migration.sql > prisma/combined-migration.sql

# Appliquer sur D1
wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
```

## Étape 4: Configurer les variables d'environnement

### 4.1 Secrets (sensibles)

**Important** : Pour Cloudflare Pages, les secrets se configurent différemment que pour Workers.

#### Méthode 1 : Via le Dashboard Cloudflare (RECOMMANDÉ)

1. Allez sur https://dash.cloudflare.com
2. Pages > miniorg > Settings > Environment variables
3. Ajoutez (cliquez "Add variable") :
   - `NEXTAUTH_SECRET` = votre secret (ex: résultat de `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` = votre Google Client ID
   - `GOOGLE_CLIENT_SECRET` = votre Google Client Secret
   - `NEXTAUTH_URL` = `https://miniorg.pages.dev` (à mettre à jour après déploiement)
4. Sélectionnez "Encrypt" pour chaque secret sensible
5. Sauvegardez

#### Méthode 2 : Via CLI (après avoir créé le projet Pages)

```bash
# Pour Pages, utilisez "wrangler pages secret" (pas juste "wrangler secret")
wrangler pages secret put NEXTAUTH_SECRET --project-name=miniorg
wrangler pages secret put GOOGLE_CLIENT_ID --project-name=miniorg
wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=miniorg
wrangler pages secret put NEXTAUTH_URL --project-name=miniorg
```

**Note** : Ces commandes ne fonctionnent qu'APRÈS avoir créé le projet Pages avec le premier déploiement.

### 4.2 Variables publiques

Les variables non-sensibles sont déjà dans `wrangler.toml`.

## Étape 5: Configuration Google OAuth

Ajoutez les URIs de redirection dans [Google Cloud Console](https://console.cloud.google.com/):

1. Allez dans "APIs & Services" > "Credentials"
2. Sélectionnez votre OAuth 2.0 Client
3. Ajoutez dans "Authorized redirect URIs":
   - `https://miniorg.pages.dev/api/auth/callback/google`
   - `https://VOTRE-DOMAINE-CUSTOM.com/api/auth/callback/google` (si domaine custom)

## Étape 6: Build et déploiement

### 6.1 Build pour Cloudflare Pages

```bash
npm run pages:build
```

Cette commande utilise `@cloudflare/next-on-pages` pour adapter votre application Next.js.

### 6.2 Tester localement (optionnel mais recommandé)

```bash
npm run pages:dev
```

Visitez `http://localhost:8788` pour tester.

### 6.3 Déployer en production

**PREMIÈRE fois** - Créer le projet :
```bash
wrangler pages deploy .vercel/output/static --project-name=miniorg
```

Cela créera le projet Pages. Notez l'URL fournie (ex: `https://miniorg.pages.dev`).

**Déploiements suivants** :
```bash
wrangler pages deploy .vercel/output/static --project-name=miniorg
```

### 6.4 Configurer les secrets (APRÈS le premier déploiement)

**Via Dashboard** (recommandé) :
1. Cloudflare Dashboard > Pages > miniorg > Settings > Environment variables
2. Ajoutez toutes les variables (voir Étape 4)
3. Mettez `NEXTAUTH_URL` avec l'URL réelle : `https://miniorg.pages.dev`

**Ou via CLI** :
```bash
wrangler pages secret put NEXTAUTH_URL --project-name=miniorg
# Entrez l'URL: https://miniorg.pages.dev
```

## Étape 7: Configuration du projet Cloudflare Pages

### Via le Dashboard (optionnel mais recommandé pour CI/CD)

Si vous voulez le déploiement automatique à chaque push GitHub :

1. Allez sur [dashboard Cloudflare](https://dash.cloudflare.com) > Pages
2. "Create a project" > "Connect to Git"
3. Sélectionnez votre repo GitHub
4. Configuration :
   - Framework preset: **Next.js**
   - Build command: `npm install --legacy-peer-deps && npm run pages:build`
   - Build output directory: `.vercel/output/static`
5. Dans "Environment variables", ajoutez toutes vos variables (Étape 4)
6. Dans "Functions" > "D1 database bindings" :
   - Variable name: `DB`
   - D1 database: Sélectionnez `miniorg-production`
7. **IMPORTANT** - Dans "Settings" > "Functions" > "Compatibility flags" :
   - Ajoutez `nodejs_compat` dans la liste des flags
   - Ce flag est **essentiel** pour que Next.js fonctionne correctement
   - Sans ce flag, vous aurez l'erreur `Node.JS Compatibility Error` au runtime

**Note** : On utilise `npm install --legacy-peer-deps` pour gérer les peer dependencies conflictuelles.

**Avantage** : Chaque push sur `main` déploie automatiquement !

## Vérification

Testez ces fonctionnalités :

- [ ] Authentification Google fonctionne
- [ ] Création de tâches
- [ ] Modification de tâches
- [ ] Suppression de tâches
- [ ] Création d'événements calendrier
- [ ] Drag & drop
- [ ] Tags

## Commandes utiles

```bash
# Lister les bases D1
wrangler d1 list

# Exécuter une requête SQL sur D1
wrangler d1 execute miniorg-production --command="SELECT * FROM User LIMIT 5"

# Voir les logs en temps réel
wrangler pages deployment tail

# Lister les secrets configurés
wrangler secret list

# Supprimer un secret
wrangler secret delete SECRET_NAME
```

## Dépannage

### Erreur "DB binding not found"

Vérifiez que le `database_id` dans `wrangler.toml` est correct.

### Erreur d'authentification Google

1. Vérifiez que les redirect URIs sont corrects dans Google Console
2. Vérifiez que `NEXTAUTH_URL` correspond à votre URL de déploiement
3. Vérifiez que `NEXTAUTH_SECRET` est bien configuré

### Erreur de build

1. Assurez-vous que `@cloudflare/next-on-pages` est installé
2. Vérifiez que toutes les routes API ont `export const runtime = 'edge'`
3. Vérifiez les logs : `wrangler pages deployment tail`

## Limites du tier gratuit

- ✅ 500 builds/mois
- ✅ Bande passante illimitée
- ✅ 100,000 requêtes/jour Workers
- ✅ 5M lectures D1/jour
- ✅ 100,000 écritures D1/jour

Largement suffisant pour un usage personnel ou petit projet !

## Support

Pour toute question :
- Documentation Cloudflare Pages : https://developers.cloudflare.com/pages/
- Documentation D1 : https://developers.cloudflare.com/d1/
- Documentation next-on-pages : https://github.com/cloudflare/next-on-pages
