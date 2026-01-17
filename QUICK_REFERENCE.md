# Quick Reference - Cloudflare Deployment

## 🚀 Quick Deploy (30 min)

```bash
# 1. Installer et se connecter
wrangler login

# 2. Créer la base D1
wrangler d1 create miniorg-production
# Copiez le database_id dans wrangler.toml

# 3. Migrer le schéma
./scripts/migrate-to-d1.sh miniorg-production

# 4. Configurer les secrets (APRÈS le premier déploiement)
# Via Dashboard (recommandé):
# Cloudflare Dashboard > Pages > miniorg > Settings > Environment variables
# Ajoutez: NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL

# Ou via CLI:
wrangler pages secret put NEXTAUTH_SECRET --project-name=miniorg
wrangler pages secret put GOOGLE_CLIENT_ID --project-name=miniorg
wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=miniorg
wrangler pages secret put NEXTAUTH_URL --project-name=miniorg

# 5. Build et déployer
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=miniorg

# 6. Configurer Google OAuth
# Ajoutez dans Google Console:
# https://miniorg.pages.dev/api/auth/callback/google
```

## 📋 Commandes essentielles

### Développement
```bash
npm run dev                    # Dev local (Next.js + SQLite)
npm run pages:build            # Build pour Cloudflare
npm run pages:dev              # Test local avec Wrangler
```

### Base de données D1
```bash
wrangler d1 list                                    # Lister les bases
wrangler d1 create [name]                           # Créer une base
wrangler d1 execute [name] --command="SELECT..."    # Exécuter SQL
wrangler d1 execute [name] --file=migration.sql     # Exécuter fichier
```

### Déploiement
```bash
wrangler pages deploy .vercel/output/static --project-name=miniorg
wrangler pages deployment list                      # Lister les déploiements
wrangler pages deployment tail                      # Logs en temps réel
```

### Secrets
```bash
# Pour Pages, utilisez "wrangler pages secret" (pas juste "wrangler secret")
wrangler pages secret list --project-name=miniorg
wrangler pages secret put SECRET_NAME --project-name=miniorg
wrangler pages secret delete SECRET_NAME --project-name=miniorg

# Ou via Dashboard (recommandé):
# Cloudflare Dashboard > Pages > miniorg > Settings > Environment variables
```

## 🗂️ Structure des fichiers

```
miniorg/
├── wrangler.toml                    # Config Cloudflare
├── lib/
│   ├── prisma.ts                    # Client Prisma (dev + prod)
│   └── prisma-edge.ts               # Adapter D1 pour Edge
├── app/api/
│   ├── tasks/route.ts               # ✅ runtime='edge'
│   ├── tags/route.ts                # ✅ runtime='edge'
│   ├── calendar-events/route.ts     # ✅ runtime='edge'
│   └── auth/[...nextauth]/route.ts  # ✅ runtime='edge'
├── scripts/
│   ├── migrate-to-d1.sh             # Migration automatique
│   └── verify-deployment-ready.sh   # Vérification pré-deploy
├── docs/
│   ├── DEPLOYMENT.md                # Guide complet
│   ├── GOOGLE_OAUTH_SETUP.md        # Config OAuth
│   ├── POST_DEPLOYMENT_TESTS.md     # 25 tests
│   └── LOCAL_DEVELOPMENT.md         # Dev local
└── .github/workflows/
    └── deploy.yml                   # CI/CD (optionnel)
```

## 🔐 Variables d'environnement

### Production (Cloudflare Secrets)
```bash
NEXTAUTH_SECRET       # Chaîne aléatoire longue
NEXTAUTH_URL          # https://miniorg.pages.dev
GOOGLE_CLIENT_ID      # xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET  # GOCSPX-xxx
```

### Dev local (.env)
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Dev Wrangler (.dev.vars)
```env
NEXTAUTH_URL=http://localhost:8788
NEXTAUTH_SECRET=local-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 🐛 Dépannage rapide

### Erreur "DB binding not found"
```bash
# Vérifiez wrangler.toml database_id
# Ou testez en local:
npm run pages:dev --local
```

### Erreur OAuth
```bash
# Vérifiez:
# 1. Redirect URIs dans Google Console
# 2. NEXTAUTH_URL correspond à l'URL déployée
wrangler secret list  # Vérifier les secrets
```

### Build échoue
```bash
# Nettoyez et rebuildez
rm -rf .vercel node_modules/.cache
npm run pages:build
```

### Vérifier la config
```bash
./scripts/verify-deployment-ready.sh
```

## 📊 Monitoring

### Logs
```bash
wrangler pages deployment tail          # Temps réel
wrangler pages deployment logs          # Historique
```

### Analytics
- Dashboard Cloudflare > Pages > miniorg > Analytics
- Métriques : requêtes, latence, erreurs

### Base de données
```bash
# Statistiques
wrangler d1 execute miniorg-production --command="
  SELECT 'Users' as table_name, COUNT(*) as count FROM User
  UNION ALL
  SELECT 'Tasks', COUNT(*) FROM Task
  UNION ALL
  SELECT 'Tags', COUNT(*) FROM Tag
  UNION ALL
  SELECT 'CalendarEvents', COUNT(*) FROM CalendarEvent
"
```

## ✅ Checklist de déploiement

- [ ] Compte Cloudflare créé
- [ ] Wrangler installé et connecté
- [ ] Base D1 créée
- [ ] database_id mis à jour dans wrangler.toml
- [ ] Schéma migré vers D1
- [ ] Secrets configurés (4 secrets)
- [ ] Google OAuth redirect URIs configurés
- [ ] Build réussi : `npm run pages:build`
- [ ] Déployé : `wrangler pages deploy`
- [ ] Tests passés (voir POST_DEPLOYMENT_TESTS.md)

## 🔗 Liens utiles

- [Dashboard Cloudflare](https://dash.cloudflare.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)

## 💡 Tips

1. **Testez localement d'abord** : `npm run dev` pour développer, `npm run pages:dev` pour valider
2. **Vérifiez avant de déployer** : `./scripts/verify-deployment-ready.sh`
3. **Utilisez staging** : Créez `miniorg-staging` pour tester en production avant le prod réel
4. **Surveillez les logs** : `wrangler pages deployment tail` pendant le déploiement
5. **Domaine custom** : Configurez dans Pages > Settings > Custom domains (gratuit)

## 🎯 Performance attendue

- **Latence API** : 50-200ms (selon localisation)
- **Cold start** : < 1s
- **Warm requests** : < 100ms
- **Disponibilité** : 99.99%
- **Global** : Déployé sur 300+ datacenters Cloudflare

## 💰 Coûts (Tier gratuit)

- ✅ 500 builds/mois
- ✅ Bande passante illimitée  
- ✅ 100,000 requêtes/jour
- ✅ 5M lectures D1/jour
- ✅ 100,000 écritures D1/jour

**Suffisant pour des milliers d'utilisateurs actifs !**
