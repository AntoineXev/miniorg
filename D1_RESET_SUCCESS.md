# 🚀 Guide rapide : Reset de la base D1

## ✅ Ce qui a été fait

Votre base de données D1 a été **complètement nettoyée et recréée** avec un schéma propre.

### Tables créées :
- ✅ `User` - Utilisateurs
- ✅ `Account` - Comptes OAuth (NextAuth)
- ✅ `Session` - Sessions utilisateur (NextAuth)
- ✅ `VerificationToken` - Tokens de vérification (NextAuth)
- ✅ `Task` - Tâches avec duration
- ✅ `Tag` - Tags pour les tâches
- ✅ `CalendarEvent` - Événements de calendrier
- ✅ `_TaskTags` - Relation many-to-many Task ↔ Tag

## 📁 Nouveaux fichiers créés

### Scripts dans `/scripts/`

1. **`reset-d1.sh`** ⭐ - Script principal (clean + setup)
2. **`clean-d1.sh`** - Nettoie la base uniquement
3. **`setup-d1.sh`** - Applique le schéma uniquement
4. **`README.md`** - Documentation complète

### Schéma SQL propre

- **`prisma/d1-schema.sql`** - Schéma complet et propre (sans duplications)
- **`prisma/combined-migration.sql`** - Marqué comme obsolète

## 🔄 Utilisation

### Pour réinitialiser la base D1 locale :

```bash
./scripts/reset-d1.sh
```

### Pour réinitialiser la base D1 de production :

```bash
echo "oui" | ./scripts/reset-d1.sh
# Puis vérifiez avec --remote
wrangler d1 execute miniorg-production --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Pour appliquer à distance :

Modifiez les scripts pour ajouter `--remote` aux commandes `wrangler d1 execute`.

**Exemple** dans `reset-d1.sh`, ligne avec wrangler d1 execute :

```bash
# Avant
wrangler d1 execute $DB_NAME --file=./prisma/d1-schema.sql

# Après (pour production)
wrangler d1 execute $DB_NAME --remote --file=./prisma/d1-schema.sql
```

## 🎯 Prochaines étapes

1. **Tester localement** :
   ```bash
   npm run dev
   ```

2. **Se connecter avec Google OAuth**

3. **Créer une tâche de test**

4. **Créer un événement de calendrier**

5. **Vérifier que tout fonctionne**

6. **Puis appliquer à la production** (avec `--remote`)

## 📊 Vérifications utiles

```bash
# Lister toutes les tables
wrangler d1 execute miniorg-production --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Voir le schéma de la table User
wrangler d1 execute miniorg-production --command="PRAGMA table_info(User);"

# Compter les utilisateurs
wrangler d1 execute miniorg-production --command="SELECT COUNT(*) FROM User;"

# Voir les dernières tâches
wrangler d1 execute miniorg-production --command="SELECT * FROM Task ORDER BY createdAt DESC LIMIT 5;"
```

## ⚠️ Note importante

**La base qui a été réinitialisée est la base LOCALE** (`.wrangler/state/v3/d1`).

Pour appliquer ces changements à la **base de production distante** sur Cloudflare, ajoutez le flag `--remote` aux commandes wrangler.

---

## 🐛 En cas de problème

Si vous voyez des erreurs de permission :
```bash
# Ajouter --remote pour exécuter sur Cloudflare
wrangler d1 execute miniorg-production --remote --file=./prisma/d1-schema.sql
```

Si les tables existent déjà :
```bash
# Nettoyer d'abord
./scripts/clean-d1.sh
# Puis recréer
./scripts/setup-d1.sh
```
