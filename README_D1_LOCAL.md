# Configuration D1 Local

## Introduction

Ce projet utilise Cloudflare D1 comme base de données, à la fois en développement et en production. Cela garantit la cohérence entre les environnements.

## Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de D1 en local

Lancez le script de setup :

```bash
chmod +x scripts/setup-d1-local.sh
./scripts/setup-d1-local.sh
```

Ou manuellement :

```bash
# Créer la base de données locale
wrangler d1 create DB --local

# Appliquer le schéma
wrangler d1 execute DB --local --file=./prisma/d1-schema.sql
```

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

## Commandes utiles

### Requêtes SQL directes

```bash
# Lister tous les utilisateurs
wrangler d1 execute DB --local --command "SELECT * FROM User;"

# Lister toutes les tâches
wrangler d1 execute DB --local --command "SELECT * FROM Task;"

# Vider une table
wrangler d1 execute DB --local --command "DELETE FROM Task;"
```

### Réinitialiser la base de données

```bash
# Supprimer et recréer
rm -rf .wrangler
./scripts/setup-d1-local.sh
```

### Appliquer des migrations

Après modification du schéma Prisma :

```bash
# Générer le nouveau schéma SQL
npx prisma migrate dev --create-only

# Copier le SQL dans d1-schema.sql
# Puis appliquer
wrangler d1 execute DB --local --file=./prisma/d1-schema.sql
```

## Architecture

- **Développement local** : Wrangler D1 local (SQLite)
- **Production** : Cloudflare D1
- **Adaptateur** : `@prisma/adapter-d1` pour les deux environnements

## Fichiers importants

- `lib/prisma.ts` : Client Prisma avec détection automatique de l'environnement
- `lib/prisma-edge.ts` : Helpers pour Edge Runtime (Cloudflare Workers)
- `prisma/schema.prisma` : Schéma de la base de données
- `prisma/d1-schema.sql` : SQL généré pour D1
- `wrangler.toml` : Configuration D1

## Dépannage

### Erreur "Table doesn't exist"

```bash
wrangler d1 execute DB --local --file=./prisma/d1-schema.sql
```

### Réinitialiser complètement

```bash
rm -rf .wrangler node_modules/.prisma
npm install
./scripts/setup-d1-local.sh
```

### Voir les logs de D1

```bash
wrangler d1 execute DB --local --command "SELECT * FROM sqlite_master WHERE type='table';"
```
