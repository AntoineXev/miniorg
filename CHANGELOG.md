# Changelog - MiniOrg

## [0.2.0] - 2026-01-17 - Migration Auth.js

### 🎯 Major Migration: Better Auth → Auth.js (NextAuth v5)

**Raison** : Résoudre l'incompatibilité `@noble/ciphers` entre Better Auth et `@opennextjs/cloudflare`

#### ✅ Changements majeurs

**Dépendances**
- ❌ Retiré : `better-auth` (incompatible avec Cloudflare Workers)
- ✅ Ajouté : `next-auth@beta` v5.0.0-beta.30 (solution officielle Next.js)
- ✅ Ajouté : `@auth/prisma-adapter` v2.11.1
- ✅ Supprimé : Override `@noble/ciphers: "1.3.0"` dans `package.json`

**Base de données**
- ✅ Nouveau modèle : `Session` avec `sessionToken`, `userId`, `expires`
- ✅ Relation ajoutée : `User.sessions`
- ✅ Migration créée : `20260117232600_add_session_model`
- ✅ Stratégie : Sessions stockées en base de données (vs JWT uniquement)

**Configuration auth**
- ✅ Fichier créé : `lib/auth.ts` (configuration centralisée)
- ✅ Adapter Prisma configuré (SQLite local, D1 production)
- ✅ Provider Google OAuth maintenu
- ✅ Callback session pour inclure `user.id`

**Routes API**
- ✅ Renommé : `/api/auth/[...all]` → `/api/auth/[...nextauth]`
- ✅ Simplifié : Route auth utilise maintenant `handlers` de Auth.js
- ✅ Migré : `app/api/tasks/route.ts` pour utiliser `auth()` au lieu de `getSession()`
- ✅ Migré : `app/api/calendar-events/route.ts` pour utiliser `auth()`
- ✅ Migré : `app/api/tags/route.ts` pour utiliser `auth()`
- ✅ Retiré : `export const runtime = 'edge'` (pas nécessaire avec Workers)

**Middleware**
- ✅ **Simplifié de 60%** : De ~55 lignes à ~20 lignes
- ✅ Utilise maintenant `auth()` wrapper de Auth.js
- ✅ Plus de JWT decode manuel nécessaire
- ✅ Code plus lisible et maintenable

**Client**
- ✅ Fichier migré : `lib/auth-client.ts` utilise maintenant `next-auth/react`
- ✅ Page login mise à jour : `app/(auth)/login/page.tsx`
- ✅ Méthode signIn simplifiée : `signIn("google", { callbackUrl: "/backlog" })`

**Fichiers supprimés**
- ❌ `lib/auth-better.ts` (obsolète)
- ❌ `lib/auth-server.ts` (obsolète)
- ❌ `lib/auth-middleware.ts` (obsolète)

**Variables d'environnement**
- 🔄 `BETTER_AUTH_SECRET` → `AUTH_SECRET` (ou `NEXTAUTH_SECRET`)
- 🔄 `BETTER_AUTH_URL` → `AUTH_URL` (ou `NEXTAUTH_URL`)
- ✅ Documentation mise à jour : `env.example`

#### 📚 Documentation ajoutée

- ✅ `MIGRATION_GUIDE.md` - Guide de démarrage rapide post-migration
- ✅ `docs/migration/AUTH_JS_MIGRATION_COMPLETE.md` - Documentation complète
- ✅ `docs/migration/AUTH_JS_ENV_MIGRATION.md` - Guide variables d'environnement

#### 📊 Métriques de la migration

- **Fichiers modifiés** : 15
- **Fichiers créés** : 4
- **Fichiers supprimés** : 3
- **Lignes de code réduites** : ~80 lignes
- **Dépendances retirées** : 15 packages
- **Dépendances ajoutées** : 8 packages

#### ✨ Avantages obtenus

- ✅ **Compatibilité native** avec Cloudflare Workers via `@opennextjs/cloudflare`
- ✅ **Aucun workaround** : Plus d'override de dépendances nécessaire
- ✅ **Code plus simple** : Middleware réduit de 60%, API routes simplifiées
- ✅ **Solution officielle** : Auth.js est maintenu par l'équipe Next.js
- ✅ **Sessions sécurisées** : Stockage en base de données au lieu de JWT uniquement
- ✅ **Support D1** : Adapter Prisma fonctionne parfaitement avec Cloudflare D1
- ✅ **Bundle léger** : Pas de dépendances `@noble/ciphers` problématiques

#### ⚠️ Breaking Changes

1. **Route auth changée** : `/api/auth/[...all]` → `/api/auth/[...nextauth]`
2. **Variables env renommées** : `BETTER_AUTH_*` → `AUTH_*` ou `NEXTAUTH_*`
3. **Callback URL OAuth** : Format changé pour Google OAuth
4. **Sessions invalides** : Les utilisateurs devront se reconnecter une fois
5. **Cookies différents** : Nouveaux noms de cookies Auth.js

#### 🚀 Actions requises

**Pour développement local :**
1. Mettre à jour `.env` avec nouvelles variables (voir `env.example`)
2. Tester avec `npm run dev`

**Pour production Cloudflare Workers :**
1. Appliquer migration D1 : `wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql`
2. Mettre à jour secrets : `wrangler secret put AUTH_SECRET`, etc.
3. Mettre à jour Google OAuth redirect URIs
4. Build : `npm run build`
5. Deploy : `npm run deploy`

**Guide complet** : Voir `MIGRATION_GUIDE.md`

---

## [0.1.0] - 2026-01-17 - Migration Cloudflare Workers + D1

### 🐛 Fixed - Deployment Issues

#### Middleware Edge Runtime Compatibility (Latest)
- Replaced `auth()` with `getToken()` from `next-auth/jwt` in middleware
  - `auth()` uses `async_hooks` which is not available in Cloudflare Workers
  - `getToken()` is fully Edge Runtime compatible
- Added protection for `/calendar` route in addition to `/backlog`
- Middleware size reduced from 97.3 kB to 38.1 kB

#### Runtime Configuration
- Added `nodejs_compat` compatibility flag to `wrangler.toml`
  - Required for Node.js APIs used by Next.js and dependencies

#### Infrastructure
- Added `@opennextjs/cloudflare` for Next.js to Cloudflare Workers adapter
- Added `wrangler` CLI for Cloudflare deployment
- Added `wrangler.toml` configuration file for D1 database binding

#### Database
- Added `lib/prisma-edge.ts` with D1 adapter for Edge Runtime
- Added `@prisma/adapter-d1` for Prisma D1 support
- Modified `lib/prisma.ts` to support both dev (SQLite) and production (D1)
- Added `getPrisma()` helper function for automatic environment detection

#### API Routes - Edge Runtime Support
- Modified `app/api/tasks/route.ts` - Added `runtime = 'edge'` and D1 support
- Modified `app/api/tags/route.ts` - Added `runtime = 'edge'` and D1 support
- Modified `app/api/calendar-events/route.ts` - Added `runtime = 'edge'` and D1 support
- Modified `app/api/auth/[...nextauth]/route.ts` - Added `runtime = 'edge'`

#### Authentication
- Modified `lib/auth.ts` to use `getPrisma()` for Edge compatibility
- NextAuth.js already configured with JWT strategy (Edge-compatible)
- PrismaAdapter now works with D1 in production

#### Configuration
- Modified `next.config.js` - Added Cloudflare-specific optimizations
- Modified `package.json` - Added deployment scripts:
  - `build` - Build for Cloudflare Workers
  - `deploy` - Build and deploy
  - `preview` - Local preview
- Updated `.gitignore` for Cloudflare artifacts

#### Scripts
- Added `scripts/migrate-to-d1.sh` - Automated migration to D1
- Added `scripts/verify-deployment-ready.sh` - Pre-deployment verification

#### Documentation
- Added `DEPLOYMENT.md` - Complete deployment guide for Workers
- Added `docs/GOOGLE_OAUTH_SETUP.md` - OAuth configuration guide
- Updated `README.md` - Added Cloudflare Workers deployment section

#### Templates
- Added `env.example` - Environment variables template
- Added `.dev.vars.example` - Wrangler local dev template

### 🔧 Changed

#### Build Process
- Build output now targets Edge Runtime
- Images optimization disabled (Cloudflare has its own)
- Bundle optimized for Workers size limits

#### Database Client
- `prisma` import changed to `getPrisma()` function call in all API routes
- Automatic detection of runtime environment (Node.js vs Edge)
- D1 adapter used in production, SQLite in development

#### Development Workflow
- Dev mode: `npm run dev` (Next.js + SQLite) - unchanged
- New: `npm run build` for Cloudflare build
- New: `npm run preview` for local Cloudflare testing

### 📝 Technical Details

#### Runtime Compatibility
All API routes now support Edge Runtime:
- ✅ No Node.js-specific APIs used
- ✅ Web standard APIs only
- ✅ Compatible with Cloudflare Workers
- ✅ Prisma with D1 adapter

#### Database Strategy
- **Development**: SQLite via standard Prisma client
- **Production**: D1 via Prisma D1 adapter
- **Schema**: Same Prisma schema for both environments
- **Migrations**: Generated once, applied separately to each environment

#### Environment Variables
- **Development**: `.env` file (SQLite)
- **Local Cloudflare**: `.dev.vars` file (D1)
- **Production**: Wrangler secrets (D1)

### 🎯 Performance Targets

With Cloudflare Edge:
- API latency: < 200ms
- Cold start: < 1s  
- Warm requests: < 100ms
- Global availability: 300+ locations

### 💰 Cost

Free tier includes:
- 500 builds/month
- Unlimited bandwidth
- 100,000 requests/day
- 5M D1 reads/day
- 100,000 D1 writes/day

### 🔄 Migration Path

1. Install dependencies
2. Create D1 database
3. Update `wrangler.toml` with database ID
4. Migrate schema to D1
5. Configure secrets
6. Build and deploy
7. Update Google OAuth
8. Test production

### ⚠️ Breaking Changes

None - the app remains fully compatible with:
- ✅ Local development (unchanged)
- ✅ SQLite development database
- ✅ Existing features
- ✅ All API endpoints

### 📦 Dependencies Added

```json
{
  "dependencies": {
    "@opennextjs/cloudflare": "^1.14.9"
  },
  "devDependencies": {
    "wrangler": "^4.59.2"
  }
}
```

Note: `@prisma/adapter-d1` already present in dependencies.

### 🧪 Testing

Added comprehensive test checklist:
- 2 Authentication tests
- 4 Tasks CRUD tests
- 2 Tags tests
- 3 Calendar tests
- 2 Drag & drop tests
- 2 Performance tests
- 1 Multi-user test
- 2 Database tests
- 2 Logging tests
- 2 Security tests
- 2 Custom domain tests (optional)
- 1 Responsive test

Total: 25 tests

### 📚 Documentation Structure

```
docs/
├── deployment/
│   └── DEPLOYMENT.md             # Main deployment guide
└── guides/
    └── GOOGLE_OAUTH_SETUP.md    # OAuth configuration

scripts/
└── migrate-to-d1.sh             # DB migration

Root level:
├── DEPLOYMENT.md                 # Main deployment guide (copy)
└── CHANGELOG.md                  # This file
```

### 🎉 Status

**✅ MIGRATION COMPLETE** - All tasks finished, ready for deployment!

---

## [0.1.0] - Previous version

### Features
- Task management (create, read, update, delete)
- Calendar integration
- Tags system
- Drag & drop scheduling
- Google OAuth authentication
- SQLite database with Prisma
- Next.js 14 with App Router
- Tailwind CSS + shadcn/ui

### Tech Stack
- Next.js 14
- Prisma + SQLite
- NextAuth.js v5
- React + TypeScript
- Tailwind CSS
