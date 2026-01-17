# Guide de déploiement sur Cloudflare Workers avec OpenNext

Ce guide vous accompagne pas à pas pour déployer MiniOrg sur Cloudflare Workers en utilisant **@opennextjs/cloudflare**.

## 🎯 Pourquoi Workers + OpenNext ?

✅ **Node.js Runtime** : Accès complet aux APIs Node.js (vs Edge Runtime limité)  
✅ **Meilleure compatibilité** : Next.js 15+ entièrement supporté  
✅ **Moins de contraintes** : Pas besoin de forcer `edge` runtime partout  
✅ **Plus stable** : Moins de workarounds nécessaires  
✅ **Better-auth & Prisma** : Fonctionnent sans problème  

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

Votre `wrangler.toml` devrait ressembler à :

```toml
name = "miniorg"
compatibility_date = "2025-01-01"
main = ".worker-next/index.mjs"

# Compatibility flags for Node.js APIs
compatibility_flags = ["nodejs_compat"]

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "votre-database-id-ici"

# Assets binding for static files
[[assets]]
binding = "ASSETS"
directory = ".worker-next/assets"

[vars]
NODE_ENV = "production"
```

⚠️ **Le flag `nodejs_compat` est essentiel** pour le support complet de Node.js.

## Étape 3: Migrer le schéma de base de données

### 3.1 Combiner les migrations

```bash
cat prisma/migrations/*/migration.sql > prisma/combined-migration.sql
```

### 3.2 Appliquer sur D1

```bash
wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
```

Ou utilisez le script automatisé :

```bash
./scripts/migrate-to-d1.sh miniorg-production
```

## Étape 4: Configurer les variables d'environnement

Les **secrets** (variables sensibles) se configurent via Wrangler :

```bash
# Générer un secret pour NEXTAUTH_SECRET
openssl rand -base64 32

# Configurer les secrets
wrangler secret put NEXTAUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put NEXTAUTH_URL
```

Quand vous exécutez `wrangler secret put NEXTAUTH_URL`, entrez votre URL de Worker :
```
https://miniorg.YOUR-SUBDOMAIN.workers.dev
```

**Note** : Les secrets sont différents des variables publiques dans `[vars]`.

## Étape 5: Configuration Google OAuth

Ajoutez les URIs de redirection dans [Google Cloud Console](https://console.cloud.google.com/):

1. Allez dans "APIs & Services" > "Credentials"
2. Sélectionnez votre OAuth 2.0 Client
3. Ajoutez dans "Authorized redirect URIs":
   - `https://miniorg.YOUR-SUBDOMAIN.workers.dev/api/auth/callback/google`
   - `https://VOTRE-DOMAINE-CUSTOM.com/api/auth/callback/google` (si domaine custom)

## Étape 6: Build et déploiement

### 6.1 Installer les dépendances

```bash
npm install
```

Cela installera `@opennextjs/cloudflare` automatiquement.

### 6.2 Build avec OpenNext

```bash
npm run build:worker
```

Cette commande :
1. Build Next.js normalement (`next build`)
2. Transforme le build pour Cloudflare Workers avec OpenNext
3. Crée le dossier `.worker-next/` avec le Worker optimisé

### 6.3 Tester localement (optionnel mais recommandé)

```bash
npm run preview
```

Cela lance Wrangler en mode dev. Visitez `http://localhost:8787` pour tester.

**Note** : En local, la base D1 distante sera utilisée par défaut.

### 6.4 Déployer en production

```bash
npm run deploy
```

Ou manuellement :

```bash
wrangler deploy
```

Cela déploiera votre Worker. Notez l'URL fournie (ex: `https://miniorg.YOUR-SUBDOMAIN.workers.dev`).

### 6.5 Vérifier les secrets après déploiement

```bash
# Lister les secrets configurés
wrangler secret list

# Vérifier que vous avez :
# - NEXTAUTH_SECRET
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - NEXTAUTH_URL
```

Si un secret manque, ajoutez-le :

```bash
wrangler secret put NOM_DU_SECRET
```

## Étape 7: Configuration d'un domaine custom (optionnel)

### Via le Dashboard Cloudflare

1. Allez sur [dashboard Cloudflare](https://dash.cloudflare.com) > Workers & Pages
2. Sélectionnez votre Worker `miniorg`
3. Allez dans "Settings" > "Triggers" > "Custom Domains"
4. Cliquez "Add Custom Domain"
5. Entrez votre domaine (ex: `app.votredomaine.com`)
6. Cloudflare configurera automatiquement le DNS

### Mettre à jour NEXTAUTH_URL

Une fois le domaine configuré :

```bash
wrangler secret put NEXTAUTH_URL
# Entrez: https://app.votredomaine.com
```

### Mettre à jour Google OAuth

N'oubliez pas d'ajouter le nouveau domaine dans Google Cloud Console :
- `https://app.votredomaine.com/api/auth/callback/google`

## Étape 8: CI/CD avec GitHub Actions (optionnel)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build with OpenNext
        run: npm run build:worker
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Configurez `CLOUDFLARE_API_TOKEN` dans GitHub Secrets :
1. Cloudflare Dashboard > Mon profil > API Tokens
2. "Create Token" > "Edit Cloudflare Workers"
3. Copiez le token
4. GitHub repo > Settings > Secrets > New repository secret
5. Nom: `CLOUDFLARE_API_TOKEN`, Valeur: votre token

## Vérification post-déploiement

Testez ces fonctionnalités :

- [ ] Page d'accueil charge correctement
- [ ] Authentification Google fonctionne
- [ ] Création de tâches
- [ ] Modification de tâches
- [ ] Suppression de tâches
- [ ] Création d'événements calendrier
- [ ] Drag & drop dans le backlog
- [ ] Tags
- [ ] Middleware de redirection fonctionne

## Commandes utiles

```bash
# Build pour Workers
npm run build:worker

# Test local avec Wrangler
npm run preview

# Déployer en production
npm run deploy

# Voir les logs en temps réel
wrangler tail

# Exécuter une requête SQL sur D1
wrangler d1 execute miniorg-production --command="SELECT * FROM User LIMIT 5"

# Lister les secrets
wrangler secret list

# Supprimer un secret
wrangler secret delete SECRET_NAME

# Voir les détails du Worker déployé
wrangler deployments list
```

## Structure du build OpenNext

Après `npm run build:worker`, vous verrez :

```
.worker-next/
├── index.mjs           # Point d'entrée du Worker
├── assets/             # Assets statiques (CSS, JS, images)
├── server/             # Code serveur Next.js transformé
└── ...
```

Ce dossier est optimisé pour Cloudflare Workers et contient tout ce dont vous avez besoin.

## Différences avec Pages (@cloudflare/next-on-pages)

| Feature | Pages (next-on-pages) | Workers (OpenNext) |
|---------|----------------------|-------------------|
| Runtime | Edge Runtime uniquement | Node.js Runtime |
| APIs Node.js | Limitées | Complètes (selon workerd) |
| Next.js 15+ | Support partiel | Support complet |
| Contraintes | Beaucoup (edge runtime) | Peu |
| Configuration | `.vercel/output/static` | `.worker-next/` |
| Build command | `@cloudflare/next-on-pages` | `@opennextjs/cloudflare` |

## Dépannage

### Erreur "DB binding not found"

**Cause** : Le binding D1 n'est pas correctement configuré.

**Solution** :
1. Vérifiez que `wrangler.toml` a le bon `database_id`
2. Vérifiez que la DB existe : `wrangler d1 list`
3. Re-déployez : `npm run deploy`

### Erreur d'authentification Google

**Cause** : Configuration OAuth incorrecte.

**Solution** :
1. Vérifiez les redirect URIs dans Google Console
2. Vérifiez que `NEXTAUTH_URL` correspond exactement à votre URL
3. Vérifiez que tous les secrets sont configurés : `wrangler secret list`

### Erreur "Module not found" ou build échoue

**Cause** : Dépendance incompatible ou manquante.

**Solution** :
1. Vérifiez que `@opennextjs/cloudflare` est installé : `npm list @opennextjs/cloudflare`
2. Nettoyez et réinstallez : `rm -rf node_modules .next && npm install`
3. Re-buildez : `npm run build:worker`

### Worker trop volumineux

**Cause** : Le Worker dépasse la limite de 10 MiB (plan payant) ou 3 MiB (gratuit).

**Solution** :
1. Vérifiez la taille compressée après build (c'est celle qui compte)
2. Supprimez les dépendances inutilisées
3. Utilisez le code splitting de Next.js
4. Passez au plan Workers Paid si nécessaire (10 MiB limit)

### Logs et debugging

```bash
# Voir les logs en temps réel
wrangler tail

# Voir les logs d'un déploiement spécifique
wrangler tail --filter <DEPLOYMENT_ID>

# Debug local avec inspection
wrangler dev --local --inspect
```

## Limites du tier gratuit Workers

- ✅ **100,000 requêtes/jour**
- ✅ **10ms CPU time par requête**
- ✅ Bande passante illimitée
- ✅ 5M lectures D1/jour
- ✅ 100,000 écritures D1/jour
- ⚠️ 3 MiB de taille Worker (10 MiB sur plan payant)

Largement suffisant pour un usage personnel ou petit projet !

## Avantages Workers vs Pages

### ✅ Workers avec OpenNext
- Runtime Node.js complet
- Meilleure compatibilité Next.js
- Moins de workarounds
- Support ISR, PPR, etc.
- Better-auth fonctionne parfaitement

### ⚠️ Pages avec next-on-pages
- Edge Runtime uniquement
- Limitations sur les packages NPM
- Nécessite `export const runtime = 'edge'` partout
- Support Next.js incomplet

## Performance Tips

1. **Utilisez le cache Cloudflare** : Les assets statiques sont automatiquement cachés
2. **Optimisez les images** : `unoptimized: true` est déjà configuré
3. **Réduisez les bundles** : Évitez les grosses librairies si possible
4. **Utilisez ISR** : Pour les pages qui changent peu
5. **Monitoring** : Utilisez Cloudflare Analytics pour suivre les performances

## Support

Pour toute question :
- **Documentation OpenNext Cloudflare** : https://opennext.js.org/cloudflare
- **Documentation Cloudflare Workers** : https://developers.cloudflare.com/workers/
- **Documentation D1** : https://developers.cloudflare.com/d1/
- **Issues OpenNext** : https://github.com/opennextjs/opennextjs-cloudflare

## Migration depuis Pages

Si vous migrez depuis `@cloudflare/next-on-pages` :

1. ✅ Désinstallez `@cloudflare/next-on-pages`
2. ✅ Installez `@opennextjs/cloudflare`
3. ✅ Mettez à jour `wrangler.toml` (voir Étape 2.1)
4. ✅ Mettez à jour les scripts dans `package.json`
5. ✅ (Optionnel) Supprimez `export const runtime = 'edge'` des routes
6. ✅ Buildez et déployez : `npm run build:worker && npm run deploy`

C'est tout ! Votre app devrait fonctionner beaucoup mieux. 🚀

---

**Dernière mise à jour** : Janvier 2026  
**Version OpenNext** : 1.1.1  
**Version Next.js** : 16.1.3
