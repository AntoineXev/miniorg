# Scripts de gestion de la base D1

Ce dossier contient les scripts pour gérer votre base de données Cloudflare D1.

## 📁 Fichiers

### Scripts principaux

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

### Scénario 0 : Vérifier avant déploiement Workers

**Nouveau !** Avant de déployer sur Cloudflare Workers, vérifiez que tout est correctement configuré :

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

Si tout est OK, vous pouvez déployer :
```bash
npm run build:worker && npm run deploy
```

### Scénario 1 : Réinitialiser la base D1 LOCALE (développement)

**Utilisation la plus courante** - Nettoie et recrée tout from scratch localement :

```bash
./scripts/reset-d1.sh
```

Ce script :
1. ✅ Demande confirmation avant de procéder
2. 🗑️ Supprime toutes les tables existantes de la base locale
3. 📦 Applique le schéma complet depuis `prisma/d1-schema.sql`
4. 🔍 Vérifie que tout est bien créé

### Scénario 2 : Réinitialiser la base D1 DISTANTE (production Cloudflare)

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

### Scénario 3 : Nettoyer uniquement (local)

Si vous voulez juste nettoyer sans recréer :

```bash
./scripts/clean-d1.sh
```

Puis pour recréer :

```bash
./scripts/setup-d1.sh
```

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

## 🔍 Vérifications après reset

Après avoir exécuté `reset-d1.sh`, vous pouvez vérifier :

```bash
# Lister toutes les tables
wrangler d1 execute miniorg-production --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Voir le schéma d'une table spécifique
wrangler d1 execute miniorg-production --command="PRAGMA table_info(User);"

# Compter les lignes dans une table
wrangler d1 execute miniorg-production --command="SELECT COUNT(*) FROM User;"
```

## 🛠️ Développement local

Pour votre base SQLite locale (`prisma/dev.db`), utilisez Prisma normalement :

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Reset la base locale
npx prisma migrate reset
```

## 📚 Workflow recommandé

1. **Développement local** : Utilisez Prisma normalement avec SQLite
2. **Modifier le schéma** : Éditez `prisma/schema.prisma`
3. **Créer une migration** : `npx prisma migrate dev`
4. **Mettre à jour `d1-schema.sql`** : Copiez le SQL des migrations
5. **Appliquer à D1** : `./scripts/reset-d1.sh`

## ❓ Aide

Si vous rencontrez des erreurs :

1. Vérifiez que `wrangler` est installé : `wrangler --version`
2. Vérifiez que vous êtes authentifié : `wrangler whoami`
3. Vérifiez la config dans `wrangler.toml`
4. Consultez les logs : `wrangler tail`
