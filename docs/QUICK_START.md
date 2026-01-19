# Quick Start Guide

## Setup (30 seconds)

```bash
# 1. The database is already created, just start developing!
npm run dev

# That's it! Your app now uses local SQLite instead of D1
```

## What Just Changed?

Before this implementation, you had to use `wrangler dev` to get D1 bindings. Now:

- ✅ `npm run dev` works with local SQLite
- ✅ Production automatically uses D1
- ✅ No code changes in your app
- ✅ Same Prisma API everywhere

## Examples

### Using Prisma (no changes needed!)

```typescript
import { prisma } from '@/lib/prisma'

// This works in both development and production!
export async function getTasks(userId: string) {
  return await prisma.task.findMany({
    where: { userId },
    include: { tags: true }
  })
}
```

### Switching Adapters Explicitly

If you need to test with a specific adapter:

```bash
# Force local SQLite
DB_ADAPTER=local-sqlite npm run dev

# Force D1 (requires wrangler dev)
DB_ADAPTER=d1 wrangler dev

# Future: PostgreSQL
DB_ADAPTER=postgres DATABASE_URL=postgresql://... npm run dev
```

## Common Tasks

### After Schema Changes

```bash
# 1. Update prisma/schema.prisma
# 2. Push changes to local DB
npm run db:push

# 3. For production D1, create and apply migration
npm run db:migrate:d1:create my-migration-name
npm run db:migrate:d1:apply:remote
```

### View Your Data

```bash
# Open Prisma Studio
npm run db:studio
```

### Reset Local Database

```bash
npm run db:reset
```

## Architecture At a Glance

```typescript
// lib/database/config.ts decides which adapter to use
export function getDatabaseConfig(): DatabaseConfig {
  if (process.env.DB_ADAPTER) return { adapter: process.env.DB_ADAPTER }
  if (process.env.DATABASE_URL) return { adapter: 'local-sqlite' }
  return { adapter: 'd1' } // Default for Cloudflare
}

// lib/database/client.ts creates the right PrismaClient
export function createPrismaClient(): PrismaClient {
  const config = getDatabaseConfig()
  switch (config.adapter) {
    case 'd1': return new D1Adapter().createClient()
    case 'local-sqlite': return new LocalSQLiteAdapter(config).createClient()
    // Easy to add more!
  }
}

// lib/prisma.ts exports a singleton
export const prisma = /* uses createPrismaClient() */
```

## Deployment

### Cloudflare Workers (No Changes)

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

The D1 adapter is automatically used in production!

## Adding Support for New Databases

Want to use Neon, Supabase, Turso, or any other database?

1. Create `lib/database/adapters/my-adapter.ts`
2. Add one case to the switch in `lib/database/client.ts`
3. Done!

See `docs/DATABASE_SETUP.md` for detailed instructions.

---

**You're ready to go! Run `npm run dev` and start coding.**
