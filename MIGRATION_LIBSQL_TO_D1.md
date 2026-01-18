# Migration de LibSQL vers D1 pur

## Date : 18 janvier 2026

## Problème
Le build Cloudflare échouait avec des erreurs webpack liées à `@libsql/client` et ses dépendances (`@libsql/isomorphic-fetch`, `@libsql/isomorphic-ws`). Ces packages tentaient d'importer des fichiers README.md et LICENSE, causant l'échec du build.

## Solution
Migration complète vers l'utilisation de D1 uniquement avec l'adapter Prisma D1, en supprimant toutes les dépendances libsql.

## Changements effectués

### 1. Dépendances supprimées
- `@libsql/client`
- `@prisma/adapter-libsql`

### 2. Fichiers modifiés

#### `package.json`
- Suppression des dépendances libsql
- Conservation uniquement de `@prisma/adapter-d1`

#### `lib/prisma.ts`
- Suppression complète de l'utilisation de libsql
- Utilisation exclusive de `@prisma/adapter-d1`
- Création d'un adaptateur "dummy" pour la compatibilité au moment du build
- Détection automatique de l'environnement (Edge Runtime vs Node.js)

#### `next.config.js`
- Ajout de règles webpack pour gérer les fichiers .md et .txt
- Alias pour désactiver les imports libsql résiduels

#### `prisma/schema.prisma`
- Suppression de l'URL de datasource (déplacée vers `prisma.config.ts` selon Prisma 7)
- Suppression de la preview feature `driverAdapters` (maintenant stable)

### 3. Scripts et documentation créés

#### `scripts/setup-d1-local.sh`
Script pour configurer facilement la base de données D1 locale avec wrangler.

#### `README_D1_LOCAL.md`
Documentation complète sur :
- Configuration de D1 en local
- Commandes utiles pour gérer D1
- Architecture dev/prod
- Guide de dépannage

## Architecture finale

### Développement local
- Base de données : D1 local via wrangler (SQLite)
- Adaptateur : `@prisma/adapter-d1` avec dummy adapter pour build
- Commande : `npm run dev`

### Production (Cloudflare Workers)
- Base de données : Cloudflare D1
- Adaptateur : `@prisma/adapter-d1` avec binding D1
- Commande : `npm run build:cloudflare && npm run deploy`

## Avantages
1. ✅ Build Cloudflare fonctionne sans erreurs
2. ✅ Même adaptateur en dev et prod (cohérence)
3. ✅ Pas de dépendances libsql problématiques
4. ✅ Configuration simple avec wrangler
5. ✅ Compatible avec Prisma 7

## Tests réussis
- ✅ `npm run build` - Build Next.js standard
- ✅ `npm run build:cloudflare` - Build OpenNext Cloudflare

## Prochaines étapes recommandées
1. Configurer la base D1 locale : `./scripts/setup-d1-local.sh`
2. Tester en développement : `npm run dev`
3. Déployer sur Cloudflare : `npm run deploy`
4. Configurer les variables d'environnement dans Cloudflare Dashboard

## Notes importantes
- Prisma 7 nécessite toujours un adaptateur, d'où l'adaptateur "dummy" pour le build
- Le dummy adapter n'est jamais utilisé en runtime, seulement au moment du build
- En production, le binding D1 de Cloudflare (`process.env.DB`) est utilisé
- Le schéma SQL D1 doit être appliqué manuellement avec wrangler
