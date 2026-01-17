# Guide de développement local avec Cloudflare

Ce guide explique comment développer localement avec l'environnement Cloudflare.

## Deux modes de développement

### Mode 1 : Next.js standard (recommandé pour le dev rapide)

Utilisez ce mode pour le développement quotidien avec SQLite local :

```bash
npm run dev
```

**Avantages** :
- Hot reload ultra-rapide
- DevTools Next.js complets
- Pas besoin de rebuild
- SQLite local (pas de connexion réseau)

**Configuration** :
- Utilisez `.env` avec `DATABASE_URL="file:./prisma/dev.db"`
- Prisma utilise le client SQLite standard

### Mode 2 : Cloudflare Pages local (pour tester avant déploiement)

Utilisez ce mode pour valider avant le déploiement :

```bash
# Build pour Cloudflare
npm run pages:build

# Lancer en mode Cloudflare local
npm run pages:dev
```

**Avantages** :
- Environnement identique à la production
- Teste le Edge Runtime
- Teste les bindings D1
- Détecte les problèmes de compatibilité

**Configuration** :
- Utilisez `.dev.vars` pour les variables d'environnement
- Nécessite une base D1 locale ou distante

## Configuration .dev.vars

Créez un fichier `.dev.vars` à la racine :

```env
NEXTAUTH_SECRET=your-local-secret
NEXTAUTH_URL=http://localhost:8788
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

⚠️ **Important** : `.dev.vars` est dans `.gitignore`, ne le commitez pas !

## Utiliser D1 en local

### Option A : Base D1 locale (pour dev offline)

Wrangler peut créer une base D1 SQLite locale :

```bash
# Les données seront dans .wrangler/state/
npm run pages:dev
```

Pour initialiser le schéma :

```bash
# Créer une base D1 locale
wrangler d1 execute DB --local --file=prisma/combined-migration.sql

# Ou via le script
cat prisma/migrations/*/migration.sql | wrangler d1 execute DB --local --file=-
```

### Option B : Base D1 distante (pour tester avec vraies données)

Connectez-vous à votre base D1 de staging/production :

```bash
# Dans wrangler.toml, configurez votre database_id
# Puis lancez sans --local
npm run pages:dev
```

Les requêtes iront vers votre vraie base D1 sur Cloudflare.

## Debugging

### Logs détaillés

```bash
# Avec logs détaillés
wrangler pages dev .vercel/output/static --log-level debug
```

### Inspecter les requêtes D1

Ajoutez des logs dans `lib/prisma-edge.ts` :

```typescript
export function getPrismaClient(d1Database: D1Database): PrismaClient {
  console.log('🔍 Creating Prisma client with D1 adapter')
  
  let cached = prismaClientCache.get(d1Database)
  
  if (!cached) {
    console.log('💾 No cached client, creating new one')
    const adapter = new PrismaD1(d1Database)
    cached = new PrismaClient({ 
      adapter,
      log: ['query', 'info', 'warn', 'error'] // Active les logs
    })
    prismaClientCache.set(d1Database, cached)
  } else {
    console.log('♻️ Using cached Prisma client')
  }
  
  return cached
}
```

### DevTools Cloudflare

Avec Wrangler Pages dev, vous pouvez :

1. Inspecter les requêtes HTTP
2. Voir les logs en temps réel
3. Débugger avec Chrome DevTools

## Workflow recommandé

### Pour les nouvelles features

1. **Développement rapide avec Next.js standard** :
   ```bash
   npm run dev
   ```
   - Itérez rapidement
   - Testez votre feature
   - SQLite local pour la DB

2. **Validation Cloudflare avant commit** :
   ```bash
   npm run pages:build
   npm run pages:dev
   ```
   - Testez en mode Edge
   - Vérifiez les logs
   - Validez la compatibilité

3. **Push et déploiement** :
   ```bash
   git push
   # Cloudflare déploie automatiquement (si CI/CD configuré)
   # Ou manuellement : wrangler pages deploy
   ```

### Pour les migrations de schéma

1. **Créez la migration en local** :
   ```bash
   npx prisma migrate dev --name add_new_field
   ```

2. **Testez localement** :
   ```bash
   npm run dev
   # Testez avec SQLite local
   ```

3. **Appliquez sur D1** :
   ```bash
   # Combinez les nouvelles migrations
   cat prisma/migrations/*/migration.sql > prisma/combined-migration.sql
   
   # Appliquez sur D1 (staging d'abord !)
   wrangler d1 execute miniorg-staging --file=prisma/combined-migration.sql
   
   # Puis production
   wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
   ```

4. **Déployez le code** :
   ```bash
   npm run pages:build
   wrangler pages deploy .vercel/output/static
   ```

## Hot Reload avec Cloudflare

Malheureusement, Wrangler Pages dev ne supporte pas le hot reload comme Next.js dev.

**Solution** : 

1. Développez avec `npm run dev`
2. Quand vous voulez tester sur Cloudflare :
   ```bash
   # Terminal 1 : Watch pour rebuild auto
   npx @cloudflare/next-on-pages --watch
   
   # Terminal 2 : Wrangler en mode watch
   wrangler pages dev .vercel/output/static --live-reload
   ```

Cela rebuild automatiquement quand vous modifiez le code.

## Différences entre dev et production

| Feature | npm run dev | npm run pages:dev | Production |
|---------|-------------|-------------------|------------|
| Runtime | Node.js | Edge (simulé) | Edge (réel) |
| Database | SQLite | D1 local/remote | D1 Cloudflare |
| Hot Reload | ✅ Oui | ⚠️ Partiel | ❌ Non |
| Prisma | Client standard | Client + D1 adapter | Client + D1 adapter |
| Vitesse | ⚡ Très rapide | 🐌 Plus lent | ⚡ Rapide |
| Logs | Console | Wrangler logs | Cloudflare logs |

## Troubleshooting

### "DB binding not found"

**En mode pages:dev** :

1. Vérifiez que `wrangler.toml` a le bon `database_id`
2. Ou utilisez `--local` pour une DB locale :
   ```bash
   wrangler pages dev .vercel/output/static --local
   ```

### "Cannot find module 'prisma-edge'"

Le build Cloudflare n'a pas fonctionné correctement :

```bash
# Nettoyez et rebuildez
rm -rf .vercel
npm run pages:build
```

### Erreurs TypeScript en mode Cloudflare

Certaines APIs Node.js ne fonctionnent pas sur Edge :

❌ **Interdit** :
- `fs`, `path`, `os`
- `crypto` (utilisez Web Crypto API)
- `process.cwd()`
- Node.js streams

✅ **Autorisé** :
- `fetch`
- Web APIs (URL, FormData, etc.)
- `crypto.subtle` (Web Crypto)
- Prisma avec D1 adapter

### Performances lentes en local

C'est normal ! `wrangler pages dev` émule l'environnement Edge mais n'a pas les optimisations de production.

En production, votre app sera beaucoup plus rapide grâce :
- Au réseau Edge de Cloudflare
- À la proximité géographique
- Aux optimisations de bundling

## Commandes utiles

```bash
# Build sans déployer
npm run pages:build

# Tester le build localement
npm run pages:dev

# Inspecter le bundle généré
ls -lh .vercel/output/static/_worker.js/

# Voir les variables d'environnement disponibles
wrangler pages deployment list
wrangler secret list

# Tester une route API spécifique
curl http://localhost:8788/api/tasks

# Vérifier la compatibilité Edge
npx @cloudflare/next-on-pages --help
```

## Ressources

- [Next on Pages Documentation](https://github.com/cloudflare/next-on-pages)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
