# Architecture - MiniOrg sur Cloudflare

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                                                             │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Backlog  │  │ Calendar │  │  Today   │  │  Login   │ │
│  └───────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                             │
│              React Components (Next.js)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Edge Network                        │
│                   (300+ locations)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Cloudflare Pages (Static Assets)            │  │
│  │  • HTML, CSS, JavaScript                            │  │
│  │  • Images, Fonts                                    │  │
│  │  • Edge caching                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Workers (Edge Runtime)                      │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  API Routes (runtime = 'edge')               │ │  │
│  │  │  • /api/tasks     → Tasks CRUD               │ │  │
│  │  │  • /api/tags      → Tags management          │ │  │
│  │  │  • /api/calendar  → Calendar events          │ │  │
│  │  │  • /api/auth      → NextAuth.js (JWT)        │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  │                          │                          │  │
│  │                          ▼                          │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  Prisma Client + D1 Adapter                  │ │  │
│  │  │  • getPrisma() - Auto-detection              │ │  │
│  │  │  • PrismaD1 adapter                          │ │  │
│  │  │  • Query optimization                        │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         D1 Database (SQLite at Edge)                │  │
│  │                                                     │  │
│  │  Tables:                                           │  │
│  │  • User          - Authentication & profile        │  │
│  │  • Account       - OAuth accounts                  │  │
│  │  • Session       - User sessions                   │  │
│  │  • Task          - Tasks & todos                   │  │
│  │  • Tag           - Task tags                       │  │
│  │  • CalendarEvent - Calendar events                 │  │
│  │  • _TaskTags     - Many-to-many relation          │  │
│  │                                                     │  │
│  │  Features:                                         │  │
│  │  • 5M reads/day (free)                            │  │
│  │  • 100K writes/day (free)                         │  │
│  │  • Edge-optimized SQLite                          │  │
│  │  • Automatic backups                              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │   Google OAuth      │                                   │
│  │                     │                                   │
│  │  • Authentication   │                                   │
│  │  • User profile     │                                   │
│  │  • Token refresh    │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

## Flux de données

### 1. Authentification (Google OAuth)

```
User Browser → /login
    ↓
Click "Sign in with Google"
    ↓
Redirect to Google OAuth
    ↓
User authorizes
    ↓
Callback → /api/auth/callback/google
    ↓
NextAuth.js (Edge Runtime)
    ↓
PrismaAdapter → D1 (User, Account, Session)
    ↓
JWT token generated
    ↓
Cookie set → Redirect to /backlog
```

### 2. Lecture de tâches

```
User Browser → GET /api/tasks
    ↓
Edge Worker (Cloudflare)
    ↓
Auth check (JWT from cookie)
    ↓
getPrisma() → PrismaClient with D1 adapter
    ↓
D1 Query: SELECT * FROM Task WHERE userId = ?
    ↓
Response with tasks (JSON)
    ↓
Client renders tasks
```

### 3. Création de tâche

```
User Browser → POST /api/tasks
    ↓
Body: { title, description, tags, ... }
    ↓
Edge Worker validation (Zod)
    ↓
Auth check (JWT)
    ↓
getPrisma().task.create({ ... })
    ↓
D1 Transaction:
  - INSERT INTO Task
  - INSERT INTO _TaskTags (if tags)
    ↓
Response with created task
    ↓
Client updates UI (optimistic + refetch)
```

### 4. Drag & Drop

```
User drags task to new day
    ↓
Client-side DnD (Pragmatic Drag & Drop)
    ↓
PATCH /api/tasks
    ↓
Body: { id, scheduledDate: "2026-01-20" }
    ↓
Edge Worker
    ↓
D1 UPDATE Task SET scheduledDate = ? WHERE id = ?
    ↓
Response with updated task
    ↓
Client confirms move
```

## Architecture de développement

### Mode Development (npm run dev)

```
┌─────────────────────────────────────────┐
│        Developer Machine                │
│                                         │
│  Next.js Dev Server (localhost:3000)   │
│           ↓                             │
│  Node.js Runtime (full APIs)           │
│           ↓                             │
│  Prisma Client (standard)              │
│           ↓                             │
│  SQLite (prisma/dev.db)                │
└─────────────────────────────────────────┘

Advantages:
✅ Hot reload
✅ Fast iteration
✅ Full Node.js APIs
✅ Familiar workflow
```

### Mode Cloudflare Local (npm run pages:dev)

```
┌─────────────────────────────────────────┐
│        Developer Machine                │
│                                         │
│  Wrangler Dev Server (localhost:8788)  │
│           ↓                             │
│  Edge Runtime (simulated)              │
│           ↓                             │
│  Prisma Client + D1 Adapter            │
│           ↓                             │
│  D1 Local (or remote)                  │
└─────────────────────────────────────────┘

Advantages:
✅ Production-like environment
✅ Catches Edge incompatibilities
✅ Tests D1 bindings
✅ Pre-deployment validation
```

### Mode Production (deployed)

```
┌─────────────────────────────────────────┐
│      Cloudflare Edge (global)           │
│                                         │
│  Cloudflare Pages (CDN + Workers)      │
│           ↓                             │
│  Edge Runtime (real)                   │
│           ↓                             │
│  Prisma Client + D1 Adapter            │
│           ↓                             │
│  D1 Production (Edge SQLite)           │
└─────────────────────────────────────────┘

Advantages:
✅ Global distribution
✅ Ultra-low latency
✅ Automatic scaling
✅ 99.99% uptime
```

## Chemins de données

### Lecture (Hot Path)

```
Request → Edge Worker (nearest location)
            ↓ (< 5ms)
          D1 Query
            ↓ (< 50ms)
          Response
            ↓ (< 10ms)
          Client

Total: 50-100ms
```

### Écriture

```
Request → Edge Worker
            ↓ (< 5ms)
          Validation
            ↓ (< 1ms)
          D1 Write
            ↓ (< 100ms)
          Response
            ↓ (< 10ms)
          Client

Total: 100-200ms
```

### Cold Start

```
First Request → Worker initialization
                     ↓ (< 500ms)
                   D1 connection
                     ↓ (< 100ms)
                   Prisma client init
                     ↓ (< 200ms)
                   Request processing
                     ↓ (< 100ms)
                   Response

Total: < 1s (rare, only after inactivity)
```

## Sécurité

```
┌─────────────────────────────────────────────┐
│             Security Layers                 │
│                                             │
│  1. HTTPS Everywhere (enforced)             │
│     ↓                                       │
│  2. JWT Validation (NextAuth)               │
│     ↓                                       │
│  3. User ID in session (from JWT)           │
│     ↓                                       │
│  4. Row-Level Security (userId filter)      │
│     ↓                                       │
│  5. Input validation (Zod schemas)          │
│     ↓                                       │
│  6. Prepared statements (Prisma)            │
│     ↓                                       │
│  7. CORS (automatic)                        │
└─────────────────────────────────────────────┘
```

## Scalabilité

### Horizontal Scaling

```
Users: 1-10         → Same performance
Users: 10-100       → Same performance  
Users: 100-1,000    → Same performance
Users: 1,000-10,000 → Same performance (until free tier limits)

Cloudflare automatically scales across 300+ locations.
No configuration needed.
```

### Database Limits (Free Tier)

```
5,000,000 reads/day   = 57.8 reads/second avg
100,000 writes/day    = 1.15 writes/second avg

For typical usage:
- 1 user session     = ~10 reads/minute
- Sustainable users  = 10,000+ concurrent
```

## Monitoring

```
┌─────────────────────────────────────────┐
│       Cloudflare Dashboard              │
│                                         │
│  Analytics                              │
│  • Requests/minute                      │
│  • Latency percentiles                  │
│  • Error rates                          │
│  • Bandwidth usage                      │
│                                         │
│  Real-time Logs                         │
│  • Console.log output                   │
│  • Error traces                         │
│  • Request details                      │
│                                         │
│  D1 Metrics                             │
│  • Read/write counts                    │
│  • Query performance                    │
│  • Storage usage                        │
└─────────────────────────────────────────┘
```

## Cost Structure

```
Free Tier:
├─ Cloudflare Pages
│  ├─ 500 builds/month        [✅ Unlimited for typical usage]
│  ├─ Unlimited bandwidth     [✅ No cost ever]
│  └─ Unlimited requests       [✅ Up to 100k/day]
│
├─ Workers
│  ├─ 100,000 requests/day    [✅ ~3k active users]
│  └─ 10ms CPU time/request   [✅ Most requests < 5ms]
│
└─ D1 Database
   ├─ 5M reads/day            [✅ ~50k user sessions]
   ├─ 100k writes/day         [✅ ~10k active users]
   └─ 5 GB storage            [✅ Millions of records]

Estimated cost for 10,000 active users/month: $0.00
```

---

## Résumé

- ✅ **Global**: Déployé sur 300+ datacenters Cloudflare
- ✅ **Fast**: Latence < 200ms partout dans le monde
- ✅ **Scalable**: Gère automatiquement la charge
- ✅ **Reliable**: 99.99% uptime SLA
- ✅ **Secure**: HTTPS, JWT, Row-level security
- ✅ **Free**: Jusqu'à 10k+ utilisateurs actifs
- ✅ **Simple**: Un seul déploiement, pas de serveurs
