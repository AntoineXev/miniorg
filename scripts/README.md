# Scripts de gestion de la base D1

Ce dossier contient les scripts pour gérer votre base de données Cloudflare D1.

## 📁 Fichiers

### Scripts principaux

- **`setup-d1-local.sh`** - 🆕 Setup rapide de la base D1 locale pour développement
- **`deploy.sh`** - 🚀 Script de déploiement complet sur Cloudflare
- **`reset-d1.sh`** - ⚠️ Script complet pour nettoyer et recréer la base **LOCALE** from scratch
- **`reset-d1-remote.sh`** - 🌍 Script complet pour nettoyer et recréer la base **DISTANTE** (Cloudflare)
- **`clean-d1.sh`** - Nettoie uniquement la base locale (supprime toutes les tables)
- **`setup-d1.sh`** - Applique le schéma complet sur une base vide

### Scripts de vérification

- **`verify-worker-ready.sh`** - 🔍 Vérification complète avant déploiement Workers
- `verify-deployment-ready.sh` - Vérification avant déploiement
- `verify-nextauth-migration.sh` - Vérification migration NextAuth

### Autres scripts

- `migrate-to-d1.sh` - Script historique pour migration initiale

## 🚀 Utilisation

### Scénario 0 : Premier setup (nouveau projet)

**Pour commencer rapidement avec D1 en local :**

```bash
./scripts/setup-d1-local.sh
```

Ce script :
1. ✅ Vérifie que wrangler est installé
2. 📦 Crée la base D1 locale
3. 📝 Applique le schéma
4. ✅ Prêt à développer !

Ensuite, démarrez le serveur :
```bash
npm run dev
```

### Scénario 1 : Déployer sur Cloudflare

**Pour déployer l'application sur Cloudflare Workers :**

```bash
./scripts/deploy.sh
```

Ce script :
1. 📦 Build l'application avec OpenNext
2. 🔑 Vérifie que les secrets sont configurés
3. 🚀 Déploie sur Cloudflare
4. 📋 Affiche les prochaines étapes

Ou utilisez directement :
```bash
npm run build:cloudflare
npm run deploy
```

### Scénario 2 : Vérifier avant déploiement Workers

Avant de déployer sur Cloudflare Workers, vérifiez que tout est correctement configuré :

```bash
./scripts/verify-worker-ready.sh
```

Ce script vérifie :
- ✅ Présence de `wrangler`
- ✅ Configuration de `wrangler.toml`
- ✅ Secrets (AUTH_SECRET, AUTH_URL, etc.)
- ✅ Base D1 existe
- ✅ Configuration JWT dans `lib/auth.ts`
- ✅ Pas de `PrismaAdapter` (incompatible Workers)
- ✅ Pas de `runtime = 'nodejs'` forcé

### Scénario 3 : Réinitialiser la base D1 LOCALE (développement)

**Utilisation courante** - Nettoie et recrée tout from scratch localement :

```bash
./scripts/reset-d1.sh
```

Ce script :
1. ✅ Demande confirmation avant de procéder
2. 🗑️ Supprime toutes les tables existantes de la base locale
3. 📦 Applique le schéma complet depuis `prisma/d1-schema.sql`
4. 🔍 Vérifie que tout est bien créé

### Scénario 4 : Réinitialiser la base D1 DISTANTE (production Cloudflare)

**⚠️ ATTENTION : Affecte la production !**

```bash
./scripts/reset-d1-remote.sh
```

Ce script :
1. ⚠️ Demande confirmation explicite (taper "PRODUCTION")
2. 🌍 Se connecte à Cloudflare
3. 🗑️ Supprime toutes les tables de production
4. 📦 Applique le nouveau schéma
5. 🔍 Vérifie la création sur Cloudflare

## 📋 Schéma de base

Le schéma complet et propre est dans : **`prisma/d1-schema.sql`**

Ce fichier contient :
- ✅ Toutes les tables (User, Account, Session, Task, Tag, CalendarEvent, etc.)
- ✅ Toutes les relations et foreign keys
- ✅ Tous les index
- ✅ Sans duplications
- ✅ Prêt pour production

## ⚠️ Notes importantes

1. **Différence LOCAL vs REMOTE** :
   - `reset-d1.sh` : Affecte la base **locale** dans `.wrangler/state/v3/d1` (développement)
   - `reset-d1-remote.sh` : Affecte la base **distante** sur Cloudflare (production)
   
2. **Toutes les données seront perdues** lors du nettoyage

3. Les scripts demandent confirmation avant toute action destructive

4. Assurez-vous d'avoir `wrangler` installé et configuré :
   ```bash
   wrangler --version
   wrangler whoami
   ```

## 🔧 Migration LibSQL → D1 (Janvier 2026)

Le projet a été migré de LibSQL vers D1 pur pour résoudre les problèmes de build.

**Changements importants :**
- ❌ Suppression de `@libsql/client` et `@prisma/adapter-libsql`
- ✅ Utilisation exclusive de `@prisma/adapter-d1`
- ✅ Même adaptateur en dev et prod
- ✅ Build Cloudflare fonctionne parfaitement

Voir `MIGRATION_LIBSQL_TO_D1.md` pour plus de détails.

## 🔍 Vérifications après reset

Après avoir exécuté `reset-d1.sh`, vous pouvez vérifier :

```bash
# Lister toutes les tables (local)
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Lister toutes les tables (remote)
wrangler d1 execute miniorg-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Voir le schéma d'une table spécifique
wrangler d1 execute DB --local --command "PRAGMA table_info(User);"

# Compter les lignes dans une table
wrangler d1 execute DB --local --command "SELECT COUNT(*) FROM User;"
```

## 🛠️ Développement local

Pour travailler avec D1 en local :

```bash
# Setup initial
./scripts/setup-d1-local.sh

# Requêtes SQL directes
wrangler d1 execute DB --local --command "SELECT * FROM User;"

# Appliquer le schéma
wrangler d1 execute DB --local --file=./prisma/d1-schema.sql

# Reset complet
./scripts/reset-d1.sh
```

## 📚 Workflow recommandé

1. **Développement local** : Utilisez D1 local via wrangler
2. **Modifier le schéma** : Éditez `prisma/schema.prisma`
3. **Créer une migration** : `npx prisma migrate dev`
4. **Mettre à jour `d1-schema.sql`** : Copiez le SQL des migrations
5. **Appliquer à D1 local** : `./scripts/reset-d1.sh`
6. **Tester en dev** : `npm run dev`
7. **Déployer** : `./scripts/deploy.sh`

## 📚 Documentation supplémentaire

- **`README_D1_LOCAL.md`** - Configuration détaillée de D1 en local
- **`DEPLOY_NOW.md`** - Guide de déploiement complet
- **`BUILD_FIXED.md`** - Résumé de la correction du build
- **`MIGRATION_LIBSQL_TO_D1.md`** - Détails techniques de la migration

## ❓ Aide

Si vous rencontrez des erreurs :

1. Vérifiez que `wrangler` est installé : `wrangler --version`
2. Vérifiez que vous êtes authentifié : `wrangler whoami`
3. Vérifiez la config dans `wrangler.toml`
4. Consultez les logs : `wrangler tail`
5. Voir la documentation : `BUILD_FIXED.md`
