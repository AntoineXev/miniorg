# Fix: Erreur "d2.raw is not a function"

## ✅ Problème résolu

L'erreur `d2.raw is not a function` était causée par l'utilisation d'un "dummy client" D1 qui ne supportait pas toutes les méthodes nécessaires pour l'adaptateur Prisma D1.

## 🔧 Solution implémentée

Au lieu d'utiliser un dummy client, nous avons mis en place un **vrai client SQLite local** pour le développement, avec deux adaptateurs Prisma :

### Architecture

- **Développement local** : SQLite via `@prisma/adapter-libsql`
- **Production (Cloudflare)** : D1 via `@prisma/adapter-d1`

### Fichiers modifiés

1. **`lib/prisma-dev.ts`** (nouveau)
   - Client Prisma pour le développement local
   - Utilise `@prisma/adapter-libsql` avec SQLite
   - Base de données : `./prisma/dev.db`

2. **`lib/prisma.ts`**
   - Détection automatique de l'environnement
   - En dev local : utilise `createDevPrismaClient()` de `prisma-dev.ts`
   - En production Cloudflare : utilise l'adaptateur D1 avec `env.DB`

3. **`prisma/schema.prisma`**
   - Suppression de la preview feature `driverAdapters` (maintenant stable)
   - Provider reste `sqlite` (compatible avec les deux adaptateurs)

4. **`package.json`**
   - Ajout de `@prisma/adapter-libsql`
   - Ajout de `better-sqlite3`

5. **`env.example`**
   - Documentation mise à jour avec la nouvelle architecture

## 🚀 Utilisation

### Développement local

```bash
# Démarrer le serveur Next.js
npm run dev

# Le client Prisma utilisera automatiquement SQLite via libSQL
# Base de données : ./prisma/dev.db
```

### Production (Cloudflare)

```bash
# Build pour Cloudflare
npm run build:cloudflare

# Preview local avec Wrangler (simule l'environnement Cloudflare)
npm run preview

# Déployer
npm run deploy
```

En production, le code détecte automatiquement l'environnement Cloudflare Workers et utilise le binding D1 (`env.DB`).

## 📝 Pourquoi cette solution ?

1. **Pas de dummy client** : On utilise de vraies bases de données dans tous les environnements
2. **Compatible Prisma 7** : Les adaptateurs sont la façon recommandée d'utiliser Prisma 7
3. **Développement fluide** : Pas besoin de Wrangler pour le dev local (mais toujours possible avec `npm run preview`)
4. **Production identique** : L'API Prisma est la même, seul l'adaptateur change automatiquement

## ✨ Avantages

- ✅ Plus d'erreur "d2.raw is not a function"
- ✅ Base de données réelle en développement (SQLite)
- ✅ Base de données réelle en production (D1)
- ✅ Code identique entre dev et prod
- ✅ Pas de configuration complexe
- ✅ Migrations Prisma fonctionnent localement

## 🔍 Code technique

### Détection d'environnement (lib/prisma.ts)

```typescript
function createPrismaClient() {
  // Production Cloudflare avec D1
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && process.env.DB) {
    const adapter = new PrismaD1(process.env.DB as unknown as D1Database)
    return new PrismaClient({ adapter })
  }
  
  // Développement local avec SQLite
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    const { createDevPrismaClient } = require('./prisma-dev')
    return createDevPrismaClient()
  }
}
```

### Client dev (lib/prisma-dev.ts)

```typescript
export function createDevPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  
  const adapter = new PrismaLibSql({ url: dbUrl })
  
  return new PrismaClient({ adapter })
}
```

## 🧪 Test de connexion

Test effectué avec succès :
- ✓ Connexion à la base de données
- ✓ 1 utilisateur trouvé
- ✓ 12 tâches trouvées
- ✓ 0 tags trouvés

## 📚 Packages ajoutés

```json
{
  "@prisma/adapter-libsql": "^7.2.0",
  "better-sqlite3": "^12.6.2"
}
```

## Date

18 janvier 2026
