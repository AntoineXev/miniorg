# Guide de déploiement rapide - Cloudflare Workers

## ✅ Problème résolu !
Le build fonctionne maintenant. Les dépendances libsql ont été supprimées et remplacées par D1 pur.

## Commandes de déploiement

### 1. Vérifier que le build fonctionne
```bash
npm run build:cloudflare
```

### 2. Déployer sur Cloudflare
```bash
npm run deploy
# OU
wrangler deploy
```

## Configuration requise avant le déploiement

### 1. Variables d'environnement (secrets Cloudflare)

Via CLI :
```bash
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Via Dashboard :
1. Aller sur https://dash.cloudflare.com
2. Workers & Pages > Votre Worker > Settings > Variables
3. Ajouter les secrets :
   - `AUTH_SECRET` (générer avec : `openssl rand -base64 32`)
   - `AUTH_URL` (ex: `https://miniorg.votre-domaine.workers.dev`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### 2. Base de données D1

La base D1 est déjà configurée dans `wrangler.toml` sous le nom `miniorg-db`.

Si la base n'existe pas encore en production :
```bash
# Créer la base D1 en production
wrangler d1 create miniorg-db

# Appliquer le schéma
wrangler d1 execute miniorg-db --remote --file=./prisma/d1-schema.sql

# Vérifier
wrangler d1 execute miniorg-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 3. Configuration OAuth Google

Mettre à jour les URL autorisées dans Google Cloud Console :
- **Authorized JavaScript origins** : `https://miniorg.votre-domaine.workers.dev`
- **Authorized redirect URIs** : `https://miniorg.votre-domaine.workers.dev/api/auth/callback/google`

## Commandes utiles

### Build et preview local
```bash
npm run build:cloudflare
npm run preview
```

### Vérifier les logs en production
```bash
wrangler tail
```

### Gérer la base D1 en production
```bash
# Lister les tables
wrangler d1 execute miniorg-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# Voir les utilisateurs
wrangler d1 execute miniorg-db --remote --command "SELECT * FROM User LIMIT 10;"

# Voir les tâches
wrangler d1 execute miniorg-db --remote --command "SELECT * FROM Task LIMIT 10;"
```

### Rollback en cas de problème
```bash
wrangler rollback
```

## Checklist avant déploiement

- [ ] Build réussit : `npm run build:cloudflare` ✅
- [ ] Secrets configurés dans Cloudflare
- [ ] Base D1 créée et schéma appliqué
- [ ] OAuth Google configuré avec les bonnes URLs
- [ ] `AUTH_URL` correspond à l'URL de déploiement

## Structure des fichiers importants

```
miniorg/
├── .open-next/          # Build OpenNext (généré)
│   └── worker.js        # Worker Cloudflare
├── wrangler.toml        # Config Cloudflare
├── prisma/
│   ├── schema.prisma    # Schéma Prisma
│   └── d1-schema.sql    # SQL pour D1
└── lib/
    ├── prisma.ts        # Client Prisma avec D1
    └── prisma-edge.ts   # Helpers Edge Runtime
```

## En cas de problème

### Erreur "Table doesn't exist"
```bash
wrangler d1 execute miniorg-db --remote --file=./prisma/d1-schema.sql
```

### Erreur d'authentification
Vérifier que :
1. `AUTH_SECRET` est défini dans Cloudflare
2. `AUTH_URL` correspond à l'URL de production
3. Les URLs OAuth Google sont correctes

### Erreur de binding D1
Vérifier dans `wrangler.toml` que le binding correspond :
```toml
[[d1_databases]]
binding = "DB"
database_name = "miniorg-db"
database_id = "votre-id-d1"
```

## Support

- Documentation D1 : https://developers.cloudflare.com/d1/
- Documentation Workers : https://developers.cloudflare.com/workers/
- Documentation OpenNext : https://opennext.js.org/cloudflare
