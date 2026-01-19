# Database Configuration Guide

## Overview

This project now supports multiple database adapters through an extensible architecture. You can easily switch between:
- **Local SQLite** (for development with `npm run dev`)
- **Cloudflare D1** (for production deployment)
- **PostgreSQL** (future support)

## Quick Start

### Local Development Setup

1. **Set environment variables** (optional, defaults work for most cases):

Create a `.env.local` file if it doesn't exist:

```bash
# Database adapter: 'local-sqlite' | 'd1' | 'postgres'
DB_ADAPTER=local-sqlite
DATABASE_URL=file:./prisma/dev.db
```

2. **Initialize the local database**:

```bash
npm run db:push
```

3. **Start development server**:

```bash
npm run dev
```

The app will automatically use the local SQLite database!

### Production (Cloudflare Workers)

No configuration needed! The system automatically detects the Cloudflare D1 binding and uses it.

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

## Available Scripts

### Local Development

- `npm run dev` - Start Next.js development server (uses local SQLite)
- `npm run db:push` - Sync Prisma schema to local database
- `npm run db:push:accept-data-loss` - Force sync (accepts data loss warnings)
- `npm run db:studio` - Open Prisma Studio to browse local database
- `npm run db:reset` - Delete and recreate local database
- `npm run db:generate` - Regenerate Prisma Client

### Cloudflare D1 (Production)

- `npm run db:migrate:d1:create` - Create a new D1 migration
- `npm run db:migrate:d1:apply` - Apply migrations to local D1
- `npm run db:migrate:d1:apply:remote` - Apply migrations to production D1
- `npm run build:cloudflare` - Build for Cloudflare Workers
- `npm run deploy:cloudflare` - Deploy to Cloudflare

## How It Works

### Auto-Detection Logic

The system automatically selects the correct database adapter:

1. **Explicit adapter**: If `DB_ADAPTER` env var is set, use that
2. **DATABASE_URL present**: Use local SQLite
3. **Default**: Use Cloudflare D1 (production)

### Architecture

```
lib/
├── database/
│   ├── config.ts              # Configuration logic
│   ├── adapters/
│   │   ├── d1.ts             # Cloudflare D1 adapter
│   │   ├── local-sqlite.ts   # Local SQLite adapter
│   │   ├── postgres.ts       # PostgreSQL adapter (future)
│   │   └── index.ts          # Exports
│   └── client.ts             # Factory that creates the right client
└── prisma.ts                 # Main entry point (unchanged API)
```

### Usage in Code

Your application code doesn't change! Just import and use Prisma as usual:

```typescript
import { prisma } from '@/lib/prisma'

// Works automatically in both dev and production!
const users = await prisma.user.findMany()
```

## Adding a New Adapter

To add support for a new database (e.g., Neon, Supabase, Turso):

1. Create a new adapter file in `lib/database/adapters/`:

```typescript
// lib/database/adapters/neon.ts
import { PrismaClient } from '@prisma/client'
import type { DatabaseConfig } from '../config'

export class NeonAdapter {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  createClient(): PrismaClient {
    return new PrismaClient({
      datasources: {
        db: {
          url: this.config.url,
        },
      },
    })
  }
}
```

2. Export it from `lib/database/adapters/index.ts`

3. Add case to `lib/database/client.ts`:

```typescript
case 'neon':
  return new NeonAdapter(config).createClient()
```

4. Update the `DatabaseAdapter` type in `lib/database/config.ts`:

```typescript
export type DatabaseAdapter = 'local-sqlite' | 'd1' | 'postgres' | 'neon'
```

Done! Now you can use `DB_ADAPTER=neon` to use your new adapter.

## Troubleshooting

### Database not found errors

Run `npm run db:push` to create/sync the local database.

### Type errors in IDE

If you see TypeScript errors about PrismaClient:
1. Run `npm run db:generate` to regenerate the Prisma Client
2. Restart your TypeScript server (in VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server")

### D1 binding errors in development

Make sure `DB_ADAPTER=local-sqlite` is set or `DATABASE_URL` is configured. Never use D1 adapter in local development without `wrangler dev`.

## Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_ADAPTER` | Force a specific adapter | Auto-detect | `local-sqlite`, `d1`, `postgres` |
| `DATABASE_URL` | Database connection string | `file:./prisma/dev.db` | `file:./prisma/dev.db` or `postgresql://...` |

## Notes

- **Migrations**: Use `npm run db:push` for local SQLite development. For D1, use the wrangler commands.
- **Schema changes**: After modifying `prisma/schema.prisma`, run `npm run db:push` locally and create D1 migrations for production.
- **No code changes needed**: The adapter switching is completely transparent to your application code.
