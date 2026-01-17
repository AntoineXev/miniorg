# Guide de Déploiement Rapide

## Étape 1: Commiter les changements

```bash
git add .
git commit -m "Fix: Cloudflare async_hooks error - use Edge-compatible auth"
git push
```

## Étape 2: Configuration Cloudflare (si ce n'est pas déjà fait)

### Dans le Dashboard Cloudflare Pages:

1. **Build Settings**:
   - Build command: `npm run build:pages`
   - Build output directory: `.vercel/output/static`
   - Root directory: `/` (ou laissez vide)

2. **Environment Variables** (Settings > Environment Variables):
   ```
   NEXTAUTH_SECRET=votre_secret_ici
   NEXTAUTH_URL=https://votre-domaine.pages.dev
   GOOGLE_CLIENT_ID=votre_client_id
   GOOGLE_CLIENT_SECRET=votre_client_secret
   DATABASE_URL=file:./dev.db  (pour le build, sera remplacé par D1 au runtime)
   ```

3. **D1 Database Binding** (Settings > Functions > D1 database bindings):
   - Variable name: `DB`
   - D1 database: `miniorg-production` (ou le nom de votre DB)

## Étape 3: Vérifier le déploiement

Une fois poussé, Cloudflare va automatiquement:
1. Détecter le nouveau commit
2. Lancer le build avec `npm run build:pages`
3. Déployer sur votre domaine

### Vérifier les logs de build:
- Allez sur le dashboard Cloudflare Pages
- Cliquez sur votre projet
- Regardez l'onglet "Deployments"
- Cliquez sur le déploiement en cours pour voir les logs

## Résolution de problèmes

### Si le build échoue:
1. Vérifiez que toutes les variables d'environnement sont définies
2. Vérifiez que la commande de build est `npm run build:pages`
3. Vérifiez les logs de build dans Cloudflare

### Si l'authentification ne fonctionne pas:
1. Vérifiez que `NEXTAUTH_URL` correspond à votre domaine Cloudflare
2. Vérifiez que `NEXTAUTH_SECRET` est défini
3. Vérifiez que les credentials Google sont corrects
4. Ajoutez votre domaine Cloudflare dans les "Authorized redirect URIs" de Google OAuth

### Si la base de données ne fonctionne pas:
1. Vérifiez que la DB D1 est créée: `wrangler d1 list`
2. Vérifiez que le binding est correctement configuré (variable `DB`)
3. Exécutez les migrations si nécessaire

## Test local avant déploiement

```bash
# Build pour Cloudflare
npm run build:pages

# Si le build réussit, vous êtes prêt à pousser
```

## Commandes utiles

```bash
# Voir les logs de déploiement Cloudflare
wrangler pages deployment list

# Déployer manuellement
npm run pages:deploy

# Lister les bases D1
wrangler d1 list

# Voir le contenu de la base D1
wrangler d1 execute miniorg-production --command "SELECT * FROM User"
```
